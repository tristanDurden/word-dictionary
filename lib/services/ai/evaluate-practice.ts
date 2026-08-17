import { Type } from "@google/genai";
import { z } from "zod";

import { getGemini } from "@/lib/services/ai/providers/gemini";
import type { PracticeEvaluation } from "@/lib/types";

const EVALUATION_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

const USER_UNAVAILABLE_MESSAGE =
  "AI evaluation is temporarily unavailable.";

type EvaluatePracticeInput = {
  word: string;
  definition: string;
  studentAnswer: string;
};

export class PracticeEvaluationError extends Error {
  constructor(message: string = USER_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "PracticeEvaluationError";
  }
}

class EvaluationTimeoutError extends Error {
  constructor() {
    super("Evaluation timed out.");
    this.name = "EvaluationTimeoutError";
  }
}

class InvalidEvaluationResponseError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "InvalidEvaluationResponseError";
  }
}

/** Gemini structured-output schema (API-side shape hint). */
const geminiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    meaning: {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: "How precisely the answer matches the word meaning, 0-100",
        },
        feedback: {
          type: Type.STRING,
          description: "Short feedback on meaning accuracy",
        },
      },
      required: ["score", "feedback"],
    },
    grammar: {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: "Grammar quality of the answer, 0-100",
        },
        feedback: {
          type: Type.STRING,
          description: "Short overall grammar feedback",
        },
        mistakes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              mistake: {
                type: Type.STRING,
                description: "The incorrect fragment from the answer",
              },
              correction: {
                type: Type.STRING,
                description: "Suggested correction",
              },
              explanation: {
                type: Type.STRING,
                description: "Why it is wrong and how to fix it",
              },
            },
            required: ["mistake", "correction", "explanation"],
          },
        },
      },
      required: ["score", "feedback", "mistakes"],
    },
    overallScore: {
      type: Type.INTEGER,
      description: "Weighted overall score 0-100 (meaning 70%, grammar 30%)",
    },
    summary: {
      type: Type.STRING,
      description: "One or two encouraging sentences summarizing the attempt",
    },
  },
  required: ["meaning", "grammar", "overallScore", "summary"],
};

const scoreSchema = z.coerce
  .number()
  .transform((n) => Math.max(0, Math.min(100, Math.round(n))));

const grammarMistakeSchema = z.object({
  mistake: z.string(),
  correction: z.string(),
  explanation: z.string(),
});

/** Runtime validation of the model JSON after parse. */
const practiceEvaluationSchema = z
  .object({
    meaning: z.object({
      score: scoreSchema,
      feedback: z.string(),
    }),
    grammar: z.object({
      score: scoreSchema,
      feedback: z.string(),
      mistakes: z.array(grammarMistakeSchema).default([]),
    }),
    overallScore: scoreSchema,
    summary: z.string(),
  })
  .transform((data): PracticeEvaluation => {
    const overallScore =
      data.overallScore ||
      Math.round(data.meaning.score * 0.7 + data.grammar.score * 0.3);

    return {
      ...data,
      grammar: {
        ...data.grammar,
        mistakes: data.grammar.mistakes.filter(
          (m) => m.mistake || m.correction || m.explanation,
        ),
      },
      overallScore,
    };
  });

function buildPrompt({
  word,
  definition,
  studentAnswer,
}: EvaluatePracticeInput): string {
  return [
    "You are a vocabulary tutor grading a student's explanation of a word.",
    "Evaluate TWO things only:",
    "1) Meaning — how precisely the student captured the word's meaning vs the official definition.",
    "2) Grammar — grammar/spelling/style mistakes in the student's answer, with corrections and explanations.",
    "",
    "Scoring rules:",
    "- meaning.score: 0-100 for semantic precision (not wording similarity).",
    "- grammar.score: 0-100 for grammatical correctness of the answer text.",
    "- overallScore: round(meaning.score * 0.7 + grammar.score * 0.3).",
    "- If grammar is perfect, use mistakes: [].",
    "- Be specific and encouraging. Do not paste the full official definition unless meaning.score < 40.",
    "- Reply with JSON only matching the schema.",
    "",
    `Word: ${word}`,
    `Official definition: ${definition}`,
    `Student answer: ${studentAnswer}`,
  ].join("\n");
}

function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  return run(controller.signal)
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        throw new EvaluationTimeoutError();
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

function isRetryableError(error: unknown): boolean {
  return (
    error instanceof EvaluationTimeoutError ||
    error instanceof InvalidEvaluationResponseError
  );
}

async function evaluateOnce(
  input: EvaluatePracticeInput,
): Promise<PracticeEvaluation> {
  let response;
  try {
    response = await withTimeout(
      (signal) =>
        getGemini().models.generateContent({
          model: "gemini-3.6-flash",
          contents: buildPrompt(input),
          config: {
            abortSignal: signal,
            responseMimeType: "application/json",
            responseSchema: geminiResponseSchema,
          },
        }),
      EVALUATION_TIMEOUT_MS,
    );
  } catch (error) {
    if (error instanceof EvaluationTimeoutError) {
      throw error;
    }
    console.error("Gemini evaluation request failed:", error);
    throw new PracticeEvaluationError(USER_UNAVAILABLE_MESSAGE);
  }

  const text = response.text?.trim();
  if (!text) {
    throw new InvalidEvaluationResponseError("Empty evaluation from model.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidEvaluationResponseError(
      "Model returned invalid JSON evaluation.",
    );
  }

  const result = practiceEvaluationSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Evaluation schema mismatch:", result.error.flatten());
    throw new InvalidEvaluationResponseError(
      "Model returned evaluation in unexpected format.",
    );
  }

  return result.data;
}

export async function evaluatePracticeAnswer(
  input: EvaluatePracticeInput,
): Promise<PracticeEvaluation> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await evaluateOnce(input);
    } catch (error) {
      lastError = error;

      if (error instanceof PracticeEvaluationError) {
        throw error;
      }

      const canRetry = isRetryableError(error) && attempt < MAX_ATTEMPTS;
      if (canRetry) {
        const reason =
          error instanceof Error ? error.message : "unknown error";
        console.warn(
          `Practice evaluation attempt ${attempt} failed (${reason}), retrying.`,
        );
        continue;
      }

      break;
    }
  }

  console.error("Practice evaluation failed after retries:", lastError);
  throw new PracticeEvaluationError(USER_UNAVAILABLE_MESSAGE);
}
