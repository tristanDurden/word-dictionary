import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CreateWordPayload, SavedWord, WordPracticeProgress } from "@/lib/types";

function toPracticeProgress(
  attempts: Array<{
    overallScore: number;
    meaningScore: number;
    grammarScore: number;
  }>,
): WordPracticeProgress {
  const latest = attempts[0];
  const previous = attempts[1];

  return {
    attemptCount: attempts.length,
    latestOverallScore: latest?.overallScore ?? null,
    latestMeaningScore: latest?.meaningScore ?? null,
    latestGrammarScore: latest?.grammarScore ?? null,
    previousOverallScore: previous?.overallScore ?? null,
  };
}

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const words = await prisma.wordEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      practiceAttempts: {
        orderBy: { createdAt: "desc" },
        take: 2,
        select: {
          overallScore: true,
          meaningScore: true,
          grammarScore: true,
        },
      },
      _count: {
        select: { practiceAttempts: true },
      },
    },
  });

  const payload: SavedWord[] = words.map((entry) => {
    const { practiceAttempts, _count, ...word } = entry;
    return {
      ...word,
      createdAt: word.createdAt.toISOString(),
      practice: {
        ...toPracticeProgress(practiceAttempts),
        attemptCount: _count.practiceAttempts,
      },
    };
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const payload = (await request.json()) as CreateWordPayload;

  const word = payload.word?.trim();
  const definition = payload.definition?.trim();
  const partOfSpeech = payload.partOfSpeech?.trim() || "unknown";

  if (!word || !definition) {
    return NextResponse.json(
      { error: "Both word and definition are required." },
      { status: 400 },
    );
  }

  const created = await prisma.wordEntry.create({
    data: {
      word,
      definition,
      partOfSpeech,
      phonetic: payload.phonetic?.trim() || null,
      audioUrl: payload.audioUrl?.trim() || null,
      exampleSentence: payload.exampleSentence?.trim() || null,
      userId,
    },
  });

  const response: SavedWord = {
    ...created,
    createdAt: created.createdAt.toISOString(),
    practice: {
      attemptCount: 0,
      latestOverallScore: null,
      latestMeaningScore: null,
      latestGrammarScore: null,
      previousOverallScore: null,
    },
  };

  return NextResponse.json(response, { status: 201 });
}
