"use client";

import { useState } from "react";
import { Eye, Loader2, RotateCcw, SaveIcon, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchDictionaryWord } from "@/lib/services/dictionary";
import { useWordsStore } from "@/lib/stores/words-store";
import type { DictionaryResult } from "@/lib/types";

const DIFFICULTY_OPTIONS: { label: string; value: number }[] = [
  { label: "Easy", value: 1 },
  { label: "Medium-Easy", value: 2 },
  { label: "Medium", value: 3 },
  { label: "Medium-Hard", value: 4 },
  { label: "Hard", value: 5 },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

async function fetchSynonyms(word: string): Promise<string[]> {
  const response = await fetch(
    `/api/synonyms?word=${encodeURIComponent(word)}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch synonyms");
  }

  const data = (await response.json()) as { synonyms: string[] };
  return data.synonyms ?? [];
}

export function SynonymsGame() {
  const createWord = useWordsStore((state) => state.createWord);

  const [difficulty, setDifficulty] = useState(1);
  const [word, setWord] = useState<string | null>(null);
  const [dictionaryWord, setDictionaryWord] = useState<DictionaryResult | null>(
    null,
  );
  const [validSynonyms, setValidSynonyms] = useState<string[]>([]);
  const [foundSynonyms, setFoundSynonyms] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const remainingSynonyms = validSynonyms.filter(
    (synonym) => !foundSynonyms.includes(synonym),
  );
  const progress =
    validSynonyms.length === 0
      ? 0
      : Math.round((foundSynonyms.length / validSynonyms.length) * 100);
  const isComplete =
    validSynonyms.length > 0 && foundSynonyms.length === validSynonyms.length;

  function resetRoundState() {
    setWord(null);
    setDictionaryWord(null);
    setValidSynonyms([]);
    setFoundSynonyms([]);
    setNewSynonym("");
    setIsRevealed(false);
  }

  async function startGame() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    resetRoundState();

    try {
      const response = await fetch(`/api/random-word?difficulty=${difficulty}`);

      if (response.status === 401) {
        toast.error("Sign in to play the synonyms game.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch random word");
      }

      const { word: randomWord } = (await response.json()) as {
        word: string;
      };
      const candidate = normalize(randomWord);
      const synonyms = (await fetchSynonyms(candidate)).filter(
        (synonym) => synonym !== candidate,
      );

      if (synonyms.length === 0) {
        toast.error("Could not load synonyms for that word. Try again.");
        return;
      }

      const dictionary = await fetchDictionaryWord(candidate);
      setWord(candidate);
      setDictionaryWord(dictionary);
      setValidSynonyms(synonyms);
    } catch (error) {
      console.error("Error starting synonyms game:", error);
      toast.error("Could not start a new round. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function addSynonym() {
    if (!word) {
      return;
    }

    const guess = normalize(newSynonym);
    if (!guess) {
      toast.error("Please enter a synonym.");
      return;
    }

    if (guess === word) {
      toast.error("That’s the same word — try a synonym instead.");
      setNewSynonym("");
      return;
    }

    if (foundSynonyms.includes(guess)) {
      toast.error("You already found that synonym.");
      setNewSynonym("");
      return;
    }

    if (!validSynonyms.includes(guess)) {
      toast.error("Not a valid synonym for this word.");
      setNewSynonym("");
      return;
    }
    toast.success("YO found a new Synonym!");
    const nextFound = [...foundSynonyms, guess];
    setFoundSynonyms(nextFound);
    setNewSynonym("");

    if (nextFound.length === validSynonyms.length) {
      toast.success("You found every synonym!");
    }
  }

  async function saveWord() {
    if (!word || isSaving) {
      return;
    }

    const meaning = dictionaryWord?.meanings[0];
    const definition = meaning?.definitions[0] ?? "Saved from synonyms game.";
    const partOfSpeech = meaning?.partOfSpeech ?? "unknown";

    setIsSaving(true);
    const saved = await createWord({
      word,
      definition,
      partOfSpeech,
      phonetic: dictionaryWord?.phonetic ?? "",
      audioUrl: dictionaryWord?.audioUrl ?? "",
    });
    setIsSaving(false);

    if (!saved) {
      toast.error("Could not save word.");
      return;
    }

    toast.success(`Saved “${word}” to your dictionary.`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Synonyms Game</CardTitle>
          <CardDescription>
            Pick a random word and find as many synonyms as you can!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="synonyms-difficulty">Difficulty</Label>
            <Select
              value={String(difficulty)}
              onValueChange={(value) => setDifficulty(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger id="synonyms-difficulty">
                <SelectValue placeholder="Select a difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isLoading}
                onClick={() => void startGame()}
              >
                {isLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Shuffle data-icon="inline-start" />
                )}
                {isLoading ? "Finding a word…" : "I am lucky!"}
              </Button>
              {word && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                  onClick={() => void startGame()}
                  aria-label="Replay"
                >
                  <RotateCcw />
                </Button>
              )}
            </div>
          </div>

          {word && (
            <>
              <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Your word
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-heading text-2xl font-semibold tracking-tight">
                    {word}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isSaving}
                    onClick={() => void saveWord()}
                    aria-label="Save word"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <SaveIcon />
                    )}
                  </Button>
                </div>
                {dictionaryWord?.meanings[0]?.definitions[0] && (
                  <p className="text-center text-sm text-muted-foreground">
                    {dictionaryWord.meanings[0].definitions[0]}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <Badge variant="secondary">
                      {foundSynonyms.length}/{validSynonyms.length}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>

              {!isComplete && !isRevealed && (
                <div className="space-y-3">
                  <Label htmlFor="synonym-input">Enter a synonym</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="synonym-input"
                      value={newSynonym}
                      placeholder="Type a synonym…"
                      onChange={(event) => setNewSynonym(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSynonym();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="sm:w-auto"
                      onClick={addSynonym}
                    >
                      Add
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={() => setIsRevealed(true)}
                  >
                    <Eye data-icon="inline-start" />
                    Give up and reveal
                  </Button>
                </div>
              )}

              {(isComplete || isRevealed) && (
                <p className="text-sm text-muted-foreground">
                  {isComplete
                    ? "Nice work — you cleared the list."
                    : "Round over. Check the answers below."}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Found synonyms</CardTitle>
          <CardDescription>
            {word
              ? "Correct guesses appear here as badges."
              : "Start a round to begin collecting synonyms."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {foundSynonyms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {foundSynonyms.map((synonym) => (
                <Badge key={synonym} variant="secondary">
                  {synonym}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No synonyms yet.</p>
          )}

          {isRevealed && remainingSynonyms.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Missed synonyms</p>
              <div className="flex flex-wrap gap-2">
                {remainingSynonyms.map((synonym) => (
                  <Badge key={synonym} variant="outline">
                    {synonym}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
