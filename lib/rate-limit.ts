type RateLimitBucket = {
  timestamps: number[];
  lastRequestAt: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

const MIN_INTERVAL_MS = 1_000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

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
