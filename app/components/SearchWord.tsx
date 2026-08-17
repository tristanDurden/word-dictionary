"use client";

import {
  KeyboardEvent,
  SubmitEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Loader2, Volume2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchDialogStore } from "@/lib/stores/search-dialog-store";
import { useWordsStore } from "@/lib/stores/words-store";
import type { DictionaryResult } from "@/lib/types";

const SUGGEST_DEBOUNCE_MS = 250;
const MIN_SUGGEST_CHARS = 2;

export default function SearchWord() {
  const { data: session } = useSession();
  const canSave = Boolean(session?.user);
  const isOpen = useSearchDialogStore((state) => state.isOpen);
  const setOpen = useSearchDialogStore((state) => state.setOpen);
  const createWord = useWordsStore((state) => state.createWord);
  const dictionary = useWordsStore((state) => state.dictionary);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState("");
  const [allowSuggestions, setAllowSuggestions] = useState(true);

  const flatDefinitions = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.meanings.flatMap((meaning, meaningIndex) =>
      meaning.definitions.map((definition, definitionIndex) => ({
        id: `${meaningIndex}-${definitionIndex}`,
        partOfSpeech: meaning.partOfSpeech,
        definition,
      })),
    );
  }, [result]);

  const savedSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < MIN_SUGGEST_CHARS) {
      return [];
    }

    const seen = new Set<string>();
    return dictionary
      .map((entry) => entry.word.trim().toLowerCase())
      .filter((word) => {
        if (!word.startsWith(normalized) || seen.has(word)) {
          return false;
        }
        seen.add(word);
        return true;
      })
      .slice(0, 5);
  }, [dictionary, query]);

  const remoteOnlySuggestions = useMemo(() => {
    const saved = new Set(savedSuggestions);
    return remoteSuggestions.filter((word) => !saved.has(word)).slice(0, 8);
  }, [remoteSuggestions, savedSuggestions]);

  const allSuggestions = useMemo(
    () => [...savedSuggestions, ...remoteOnlySuggestions],
    [savedSuggestions, remoteOnlySuggestions],
  );

  const hasSuggestions = allSuggestions.length > 0;

  useEffect(() => {
    setActiveSuggestion((current) => {
      if (allSuggestions.length === 0) {
        return "";
      }
      if (current && allSuggestions.includes(current)) {
        return current;
      }
      return "";
    });
  }, [allSuggestions]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();

    if (normalized.length < MIN_SUGGEST_CHARS) {
      setRemoteSuggestions([]);
      setIsSuggesting(false);
      setSuggestionsOpen(false);
      return;
    }

    if (!allowSuggestions) {
      setIsSuggesting(false);
      setSuggestionsOpen(false);
      return;
    }

    const controller = new AbortController();
    setIsSuggesting(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/dictionary/suggest?q=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as
          | { suggestions: string[] }
          | { error: string };

        if (!response.ok || !("suggestions" in payload)) {
          setRemoteSuggestions([]);
          return;
        }

        setRemoteSuggestions(payload.suggestions);
        setSuggestionsOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setRemoteSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [allowSuggestions, query]);

  useEffect(() => {
    if (!allowSuggestions) {
      return;
    }

    if (query.trim().length < MIN_SUGGEST_CHARS) {
      return;
    }

    if (hasSuggestions || isSuggesting) {
      setSuggestionsOpen(true);
    }
  }, [allowSuggestions, hasSuggestions, isSuggesting, query]);

  function resetSearchState() {
    setQuery("");
    setIsLoading(false);
    setIsSaving(false);
    setErrorMessage("");
    setResult(null);
    setSelectedDefinitionId("");
    setRemoteSuggestions([]);
    setIsSuggesting(false);
    setSuggestionsOpen(false);
    setActiveSuggestion("");
    setAllowSuggestions(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetSearchState();
    }
  }

  function dismissSuggestions() {
    setAllowSuggestions(false);
    setSuggestionsOpen(false);
    setRemoteSuggestions([]);
    setActiveSuggestion("");
    setIsSuggesting(false);
  }

  async function searchWord(rawWord: string) {
    const normalized = rawWord.trim();
    if (!normalized) {
      setErrorMessage("Enter a word to search.");
      setResult(null);
      return;
    }

    dismissSuggestions();
    setIsLoading(true);
    setErrorMessage("");
    setSelectedDefinitionId("");

    try {
      const response = await fetch(
        `/api/dictionary?word=${encodeURIComponent(normalized)}`,
      );
      const payload = (await response.json()) as
        | DictionaryResult
        | { error: string };

      if (!response.ok) {
        setResult(null);
        setErrorMessage(
          "error" in payload
            ? payload.error
            : "Could not fetch dictionary data.",
        );
        return;
      }

      setResult(payload as DictionaryResult);
    } catch {
      setResult(null);
      setErrorMessage("Network error while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await searchWord(query);
  }

  const showSuggestionPanel =
    allowSuggestions &&
    suggestionsOpen &&
    query.trim().length >= MIN_SUGGEST_CHARS;

  function selectSuggestion(word: string) {
    setQuery(word);
    void searchWord(word);
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (showSuggestionPanel) {
        event.preventDefault();
        dismissSuggestions();
      }
      return;
    }

    if (!showSuggestionPanel || allSuggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => {
        const index = allSuggestions.indexOf(current);
        const nextIndex = index < 0 ? 0 : (index + 1) % allSuggestions.length;
        return allSuggestions[nextIndex];
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => {
        const index = allSuggestions.indexOf(current);
        const nextIndex = index <= 0 ? allSuggestions.length - 1 : index - 1;
        return allSuggestions[nextIndex];
      });
      return;
    }

    if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
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

  async function saveSelectedDefinition() {
    if (!result || !selectedDefinitionId) {
      setErrorMessage("Choose one definition before saving.");
      return;
    }

    const selected = flatDefinitions.find(
      (definitionItem) => definitionItem.id === selectedDefinitionId,
    );

    if (!selected) {
      setErrorMessage("Selected definition is not valid.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const saved = await createWord({
      word: result.word,
      definition: selected.definition,
      partOfSpeech: selected.partOfSpeech,
      phonetic: result.phonetic,
      audioUrl: result.audioUrl,
    });

    setIsSaving(false);

    if (!saved) {
      setErrorMessage("Could not save word.");
      toast.error("Could not save word.");
      return;
    }

    toast.success(`Saved “${result.word}” to your dictionary.`);
    setQuery("");
    setResult(null);
    setSelectedDefinitionId("");
    setOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12">
          <DialogTitle>Look up a word</DialogTitle>
          <DialogDescription>
            Search meanings, phonetics, and pronunciation.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={handleSearch}
          >
            <div className="min-w-0 flex-1">
              <Popover
                open={showSuggestionPanel}
                onOpenChange={setSuggestionsOpen}
              >
                <PopoverAnchor asChild>
                  <Input
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setAllowSuggestions(true);
                      setQuery(event.target.value);
                    }}
                    onKeyDown={handleQueryKeyDown}
                    onFocus={() => {
                      if (
                        allowSuggestions &&
                        query.trim().length >= MIN_SUGGEST_CHARS
                      ) {
                        setSuggestionsOpen(true);
                      }
                    }}
                    placeholder="Type a word (example: growth)"
                    className="h-10"
                    aria-label="Search word"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestionPanel}
                    aria-activedescendant={
                      activeSuggestion
                        ? `suggestion-${activeSuggestion}`
                        : undefined
                    }
                    autoComplete="off"
                    role="combobox"
                  />
                </PopoverAnchor>
                <PopoverContent
                  align="start"
                  className="z-60 w-(--radix-popover-trigger-width) p-0"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  onCloseAutoFocus={(event) => event.preventDefault()}
                >
                  <Command
                    shouldFilter={false}
                    value={activeSuggestion}
                    onValueChange={setActiveSuggestion}
                  >
                    <CommandList>
                      {!isSuggesting && !hasSuggestions && (
                        <CommandEmpty>No suggestions found.</CommandEmpty>
                      )}
                      {savedSuggestions.length > 0 && (
                        <CommandGroup heading="Saved">
                          {savedSuggestions.map((word) => (
                            <CommandItem
                              key={`saved-${word}`}
                              id={`suggestion-${word}`}
                              value={word}
                              onSelect={() => selectSuggestion(word)}
                            >
                              {word}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {(remoteOnlySuggestions.length > 0 || isSuggesting) && (
                        <CommandGroup heading="Suggestions">
                          {isSuggesting &&
                            remoteOnlySuggestions.length === 0 && (
                              <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                                <Loader2 className="size-3.5 animate-spin" />
                                Looking up words…
                              </div>
                            )}
                          {remoteOnlySuggestions.map((word) => (
                            <CommandItem
                              key={`remote-${word}`}
                              id={`suggestion-${word}`}
                              value={word}
                              onSelect={() => selectSuggestion(word)}
                            >
                              {word}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="sm:min-w-28"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4 rounded-xl border border-border">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="font-heading text-2xl font-semibold tracking-tight">
                    {result.word}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {result.phonetic
                      ? result.phonetic
                      : "Phonetic not available"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {result.audioUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => playWordTts(result.word)}
                    >
                      <Volume2 data-icon="inline-start" />
                      Speak
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-5 px-4 pb-4">
                {result.meanings.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No meanings returned for this word.
                  </p>
                )}

                <RadioGroup
                  value={selectedDefinitionId}
                  onValueChange={setSelectedDefinitionId}
                  className="gap-5"
                >
                  {result.meanings.map((meaning, meaningIndex) => (
                    <div
                      key={`${meaning.partOfSpeech}-${meaningIndex}`}
                      className="space-y-2"
                    >
                      <Badge
                        variant="secondary"
                        className="uppercase tracking-wide"
                      >
                        {meaning.partOfSpeech}
                      </Badge>
                      <div className="space-y-2">
                        {meaning.definitions.map(
                          (definition, definitionIndex) => {
                            const optionId = `${meaningIndex}-${definitionIndex}`;
                            return (
                              <Label
                                key={optionId}
                                htmlFor={optionId}
                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal transition-colors hover:bg-muted/50 has-[[data-slot=radio-group-item][data-state=checked]]:border-primary has-[[data-slot=radio-group-item][data-state=checked]]:bg-primary/5 has-[[data-slot=radio-group-item][data-checked]]:border-primary has-[[data-slot=radio-group-item][data-checked]]:bg-primary/5"
                              >
                                <RadioGroupItem
                                  value={optionId}
                                  id={optionId}
                                  className="mt-0.5"
                                />
                                <span className="leading-relaxed">
                                  {definition}
                                </span>
                              </Label>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        {result && (
          <DialogFooter className="-mx-0 -mb-0 shrink-0 sm:justify-between">
            {canSave ? (
              <Button
                type="button"
                onClick={saveSelectedDefinition}
                disabled={isSaving || !selectedDefinitionId}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save selected meaning"
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sign in with Google or GitHub to save this meaning to your
                dictionary.
              </p>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
