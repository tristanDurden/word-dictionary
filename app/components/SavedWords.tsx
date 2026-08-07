"use client";

import { useEffect, useState } from "react";
import { Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeStore } from "@/lib/stores/practice-store";
import { useWordsStore } from "@/lib/stores/words-store";
import type { WordPracticeProgress } from "@/lib/types";

function PracticeProgress({ practice }: { practice: WordPracticeProgress }) {
  const {
    attemptCount,
    latestOverallScore,
    latestMeaningScore,
    latestGrammarScore,
    previousOverallScore,
  } = practice;

  const delta =
    latestOverallScore != null && previousOverallScore != null
      ? latestOverallScore - previousOverallScore
      : null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Overall {latestOverallScore}/100</Badge>
        <Badge variant="outline">Meaning {latestMeaningScore}/100</Badge>
        <Badge variant="outline">Grammar {latestGrammarScore}/100</Badge>
        {delta != null && (
          <span className="text-xs text-muted-foreground">
            {delta > 0 ? "+" : ""}
            {delta} vs last · {attemptCount} attempt
            {attemptCount === 1 ? "" : "s"}
          </span>
        )}
        {delta == null && (
          <span className="text-xs text-muted-foreground">
            {attemptCount} attempt{attemptCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {latestOverallScore != null && (
        <Progress value={latestOverallScore} className="h-1.5" />
      )}
    </div>
  );
}

function RemoveWordButton({
  word,
  onConfirm,
}: {
  word: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleConfirm() {
    setIsRemoving(true);
    await onConfirm();
    setIsRemoving(false);
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Trash2 data-icon="inline-start" />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove “{word}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the word from your dictionary. Practice history for it
            will no longer appear here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isRemoving}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isRemoving ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SavedWords() {
  const dictionary = useWordsStore((state) => state.dictionary);
  const error = useWordsStore((state) => state.error);
  const isLoading = useWordsStore((state) => state.isLoading);
  const fetchDictionary = useWordsStore((state) => state.fetchDictionary);
  const deleteWord = useWordsStore((state) => state.deleteWord);
  const clearIfWordDeleted = usePracticeStore(
    (state) => state.clearIfWordDeleted,
  );

  useEffect(() => {
    void fetchDictionary();
  }, [fetchDictionary]);

  async function handleRemove(id: string, word: string) {
    const removed = await deleteWord(id);
    if (removed) {
      clearIfWordDeleted(id);
      toast.success(`Removed “${word}”.`);
    } else {
      toast.error("Could not remove word.");
    }
  }

  function playWordTts(word: string) {
    if (!word.trim()) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Card id="saved-words">
      <CardHeader>
        <CardTitle>Saved words</CardTitle>
        <CardDescription>
          Your private dictionary
          {dictionary.length > 0 ? ` · ${dictionary.length} words` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : dictionary.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No saved words yet. Look up a word and save a meaning to get
            started.
          </p>
        ) : (
          <ul className="space-y-3">
            {dictionary.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-base font-semibold">
                        {item.word}
                      </p>
                      <Badge variant="outline">
                        {item.partOfSpeech || "unknown"}
                      </Badge>
                      {item.phonetic && (
                        <span className="text-sm text-muted-foreground">
                          {item.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {item.definition}
                    </p>
                    {item.practice && item.practice.attemptCount > 0 && (
                      <PracticeProgress practice={item.practice} />
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => playWordTts(item.word)}
                      >
                        <Volume2 data-icon="inline-start" />
                        Speak
                      </Button>
                    </div>
                  </div>
                  <RemoveWordButton
                    word={item.word}
                    onConfirm={() => handleRemove(item.id, item.word)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
