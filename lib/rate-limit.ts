import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type RateLimitBucket = {
  timestamps: number[];
  lastRequestAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

const MIN_INTERVAL_MS = 1_000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
export const MAX_DAILY_ATTEMPTS = 10;

const globalForRateLimit = globalThis as unknown as {
  practiceRateLimitBuckets: Map<string, RateLimitBucket> | undefined;
};

const buckets =
  globalForRateLimit.practiceRateLimitBuckets ??
  new Map<string, RateLimitBucket>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.practiceRateLimitBuckets = buckets;
}

function getBucket(userId: string): RateLimitBucket {
  let bucket = buckets.get(userId);
  if (!bucket) {
    bucket = { timestamps: [], lastRequestAt: 0 };
    buckets.set(userId, bucket);
  }
  return bucket;
}

/** Enforces 1 req/sec and 20 req/min per user. Records on allow. */
export function checkPracticeRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const bucket = getBucket(userId);

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  const sinceLast = now - bucket.lastRequestAt;
  if (bucket.lastRequestAt > 0 && sinceLast < MIN_INTERVAL_MS) {
    return {
      allowed: false,
      retryAfterMs: MIN_INTERVAL_MS - sinceLast,
    };
  }

  if (bucket.timestamps.length >= MAX_PER_WINDOW) {
    const oldest = bucket.timestamps[0]!;
    return {
      allowed: false,
      retryAfterMs: WINDOW_MS - (now - oldest),
    };
  }

  bucket.lastRequestAt = now;
  bucket.timestamps.push(now);
  return { allowed: true };
}

/** UTC calendar day as a Date suitable for `@db.Date`. */
export function utcDayStart(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function practiceDailyRetryAfterMs(now: Date = new Date()): number {
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return Math.max(1, midnight.getTime() - now.getTime());
}

export function checkPracticeDailyLimit(
  todayAttemptCount: number,
): RateLimitResult {
  if (todayAttemptCount < MAX_DAILY_ATTEMPTS) {
    return { allowed: true };
  }
  return { allowed: false, retryAfterMs: practiceDailyRetryAfterMs() };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Atomically reserves one daily practice slot for the user.
 * Safe under concurrent requests; returns false when the daily cap is reached.
 */
export async function reservePracticeDailySlot(
  tx: TxClient,
  userId: string,
  day: Date = utcDayStart(),
): Promise<boolean> {
  const updated = await tx.practiceDailyUsage.updateMany({
    where: { userId, day, count: { lt: MAX_DAILY_ATTEMPTS } },
    data: { count: { increment: 1 } },
  });
  if (updated.count === 1) {
    return true;
  }

  try {
    await tx.practiceDailyUsage.create({
      data: { userId, day, count: 1 },
    });
    return true;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    // Another request created the row first — try increment again.
    const retried = await tx.practiceDailyUsage.updateMany({
      where: { userId, day, count: { lt: MAX_DAILY_ATTEMPTS } },
      data: { count: { increment: 1 } },
    });
    return retried.count === 1;
  }
}
