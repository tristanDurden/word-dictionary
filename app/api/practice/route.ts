import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { checkPracticeRateLimit } from "@/lib/rate-limit";
import {
  evaluatePracticeAnswer,
  PracticeEvaluationError,
} from "@/lib/services/ai/evaluate-practice";
import { prisma } from "@/lib/prisma";

type PracticePayload = {
  wordId?: string;
  answer?: string;
};

export async function POST(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) {
    return error;
  }

  const rateLimit = checkPracticeRateLimit(userId);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(rateLimit.retryAfterMs / 1000),
    );
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const payload = (await request.json()) as PracticePayload;
  const wordId = payload.wordId?.trim();
  const answer = payload.answer?.trim();

  if (!wordId || !answer) {
    return NextResponse.json(
      { error: "wordId and answer are required." },
      { status: 400 },
    );
  }

  const wordEntry = await prisma.wordEntry.findFirst({
    where: { id: wordId, userId },
  });

  if (!wordEntry) {
    return NextResponse.json({ error: "Word not found." }, { status: 404 });
  }

  try {
    const evaluation = await evaluatePracticeAnswer({
      word: wordEntry.word,
      definition: wordEntry.definition,
      studentAnswer: answer,
    });

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        wordEntryId: wordEntry.id,
        answer,
        meaningScore: evaluation.meaning.score,
        grammarScore: evaluation.grammar.score,
        overallScore: evaluation.overallScore,
        meaningFeedback: evaluation.meaning.feedback,
        grammarFeedback: evaluation.grammar.feedback,
        grammarMistakes: evaluation.grammar.mistakes,
        summary: evaluation.summary,
      },
    });

    return NextResponse.json({
      evaluation,
      attemptId: attempt.id,
      createdAt: attempt.createdAt,
    });
  } catch (err) {
    console.error("Practice evaluation failed:", err);

    const message =
      err instanceof PracticeEvaluationError
        ? err.message
        : "AI evaluation is temporarily unavailable.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
