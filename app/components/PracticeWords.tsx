"use client";

import { Loader2, Shuffle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePracticeStore } from "@/lib/stores/practice-store";

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <Badge variant="secondary">{score}/100</Badge>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

export function PracticeWords() {
  const currentWord = usePracticeStore((state) => state.currentWord);
  const answer = usePracticeStore((state) => state.answer);
  const evaluation = usePracticeStore((state) => state.evaluation);
  const statusMessage = usePracticeStore((state) => state.statusMessage);
  const isSubmitting = usePracticeStore((state) => state.isSubmitting);
  const setAnswer = usePracticeStore((state) => state.setAnswer);
  const pickRandomWord = usePracticeStore((state) => state.pickRandomWord);
  const submitAnswer = usePracticeStore((state) => state.submitAnswer);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice</CardTitle>
          <CardDescription>
            Explain a saved word in your own words. AI scores meaning and
            grammar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusMessage && (
            <Alert variant="destructive">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
            <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Current word
              </p>
              {currentWord ? (
                <div className="space-y-1">
                  <p className="font-heading text-2xl font-semibold tracking-tight">
                    {currentWord.word}
                  </p>
                  {currentWord.partOfSpeech && (
                    <Badge variant="outline">{currentWord.partOfSpeech}</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick a random word to begin.
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => void pickRandomWord()}
              >
                <Shuffle data-icon="inline-start" />I am lucky!
              </Button>
            </div>

            <div className="space-y-3">
              <Label htmlFor="practice-answer">Your explanation</Label>
              <Textarea
                id="practice-answer"
                className="min-h-36 resize-y"
                placeholder="Explain the meaning in your own words…"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <Button
                type="button"
                disabled={isSubmitting || !currentWord}
                onClick={() => void submitAnswer()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit answer"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>
            Scores and feedback appear after you submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!evaluation ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No evaluation yet.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ScoreCard label="Overall" score={evaluation.overallScore} />
                <ScoreCard label="Meaning" score={evaluation.meaning.score} />
                <ScoreCard label="Grammar" score={evaluation.grammar.score} />
              </div>

              {evaluation.summary && (
                <p className="text-sm leading-relaxed text-foreground/90">
                  {evaluation.summary}
                </p>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Meaning</p>
                <p className="text-sm text-muted-foreground">
                  {evaluation.meaning.feedback || "No meaning feedback."}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Grammar</p>
                <p className="text-sm text-muted-foreground">
                  {evaluation.grammar.feedback || "No grammar feedback."}
                </p>
                {evaluation.grammar.mistakes.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {evaluation.grammar.mistakes.map((mistake, index) => (
                      <li
                        key={`${mistake.mistake}-${index}`}
                        className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-950"
                      >
                        <p>
                          <span className="font-semibold text-amber-950">
                            Mistake:
                          </span>{" "}
                          {mistake.mistake}
                        </p>
                        <p>
                          <span className="font-semibold text-amber-950">
                            Correction:
                          </span>{" "}
                          {mistake.correction}
                        </p>
                        <p>
                          <span className="font-semibold text-amber-950">
                            Why:
                          </span>{" "}
                          {mistake.explanation}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
