"use client";

import { useEffect, useState } from "react";
import {
  BookCheck,
  ChevronDown,
  FolderInput,
  Trash2,
  Volume2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { usePracticeStore } from "@/lib/stores/practice-store";
import { useWordsStore } from "@/lib/stores/words-store";
import type { WordPracticeProgress } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    <div className="space-y-2">
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
  const folders = useWordsStore((state) => state.folders);
  const selectedTabId = useWordsStore((state) => state.selectedTabId);
  const error = useWordsStore((state) => state.error);
  const isLoading = useWordsStore((state) => state.isLoading);
  const fetchDictionary = useWordsStore((state) => state.fetchDictionary);
  const deleteWord = useWordsStore((state) => state.deleteWord);
  const moveWord = useWordsStore((state) => state.moveWord);
  const setWordFinished = useWordsStore((state) => state.setWordFinished);
  const getFilteredDictionary = useWordsStore(
    (state) => state.getFilteredDictionary,
  );
  const clearIfWordDeleted = usePracticeStore(
    (state) => state.clearIfWordDeleted,
  );
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const filteredDictionary = getFilteredDictionary();

  const allOpen =
    filteredDictionary.length > 0 &&
    filteredDictionary.every((item) => openIds.has(item.id));

  useEffect(() => {
    void fetchDictionary();
  }, [fetchDictionary]);

  async function handleRemove(id: string, word: string) {
    const removed = await deleteWord(id);
    if (removed) {
      clearIfWordDeleted(id);
      setOpenIds((prev) => {
        if (!prev.has(id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success(`Removed “${word}”.`);
    } else {
      toast.error("Could not remove word.");
    }
  }

  async function handleMove(id: string, word: string, folderId: string | null) {
    const moved = await moveWord(id, folderId);
    if (moved) {
      const folderName =
        folderId == null
          ? "Unsorted"
          : (folders.find((folder) => folder.id === folderId)?.name ??
            "folder");
      toast.success(`Moved “${word}” to ${folderName}.`);
    } else {
      toast.error("Could not move word.");
    }
  }

  async function handleToggleFinished(id: string, word: string, isFinished: boolean) {
    const nextFinished = !isFinished;
    const updated = await setWordFinished(id, nextFinished);
    if (updated) {
      toast.success(
        nextFinished
          ? `Moved “${word}” to Finished.`
          : `Removed “${word}” from Finished.`,
      );
    } else {
      toast.error("Could not update word.");
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

  function setItemOpen(id: string, open: boolean) {
    setOpenIds((prev) => {
      const isOpen = prev.has(id);
      if (open === isOpen) {
        return prev;
      }
      const next = new Set(prev);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function toggleAllCollapsibles() {
    if (allOpen) {
      setOpenIds(new Set());
      return;
    }
    setOpenIds(new Set(filteredDictionary.map((item) => item.id)));
  }

  const tabLabel =
    selectedTabId === "all"
      ? "All words"
      : selectedTabId === "finished"
        ? "Finished"
        : (folders.find((folder) => folder.id === selectedTabId)?.name ??
          "Folder");

  return (
    <Card id="saved-words">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Saved words</CardTitle>
          <CardDescription>
            {tabLabel}
            {filteredDictionary.length > 0
              ? ` · ${filteredDictionary.length} word${filteredDictionary.length === 1 ? "" : "s"}`
              : ""}
            {selectedTabId !== "all" && dictionary.length > 0
              ? ` (${dictionary.length} total)`
              : ""}
          </CardDescription>
        </div>
        {filteredDictionary.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleAllCollapsibles}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        )}
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
        ) : filteredDictionary.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No words in {tabLabel.toLowerCase()} yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredDictionary.map((item) => (
              <li key={item.id}>
                <Collapsible
                  open={openIds.has(item.id)}
                  onOpenChange={(open) => setItemOpen(item.id, open)}
                  className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 gap-1 px-2 font-heading text-base font-semibold [&[data-state=open]>svg]:rotate-180"
                        >
                          <ChevronDown
                            className="size-4 transition-transform duration-200"
                            data-icon="inline-start"
                          />
                          {item.word}
                        </Button>
                      </CollapsibleTrigger>
                      <Badge variant="outline">
                        {item.partOfSpeech || "unknown"}
                      </Badge>
                      {item.phonetic && (
                        <span className="text-sm text-muted-foreground">
                          {item.phonetic}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={item.isFinished ? "default" : "outline"}
                        aria-pressed={item.isFinished}
                        aria-label={
                          item.isFinished
                            ? "Remove from Finished"
                            : "Move to Finished"
                        }
                        title={
                          item.isFinished
                            ? "Remove from Finished"
                            : "Move to Finished"
                        }
                        onClick={() =>
                          void handleToggleFinished(
                            item.id,
                            item.word,
                            item.isFinished,
                          )
                        }
                      >
                        <BookCheck data-icon="inline-start" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => playWordTts(item.word)}
                      >
                        <Volume2 data-icon="inline-start" />
                        Speak
                      </Button>
                      {(folders.length > 0 || item.folderId != null) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <FolderInput data-icon="inline-start" />
                              Move
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={item.folderId == null}
                              onSelect={() =>
                                void handleMove(item.id, item.word, null)
                              }
                            >
                              Unsorted
                            </DropdownMenuItem>
                            {folders.map((folder) => (
                              <DropdownMenuItem
                                key={folder.id}
                                disabled={item.folderId === folder.id}
                                onSelect={() =>
                                  void handleMove(item.id, item.word, folder.id)
                                }
                              >
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <RemoveWordButton
                        word={item.word}
                        onConfirm={() => handleRemove(item.id, item.word)}
                      />
                    </div>
                  </div>
                  <CollapsibleContent className="mt-3 space-y-3 border-t border-border pt-3">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {item.definition}
                    </p>
                    {item.practice && item.practice.attemptCount > 0 && (
                      <PracticeProgress practice={item.practice} />
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
