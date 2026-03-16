"use client";

import { FormEvent, useMemo, useState } from "react";
import type { DictionaryResult, SavedWord } from "@/lib/types";

type SearchWordProps = {
  onWordSaved: (savedWord: SavedWord) => void;
};

export default function SearchWord({ onWordSaved }: SearchWordProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");

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

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = query.trim();
    if (!normalized) {
      setErrorMessage("Enter a word to search.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSelectedDefinitionId("");

    try {
      const response = await fetch(`/api/dictionary?word=${encodeURIComponent(normalized)}`);
      const payload = (await response.json()) as DictionaryResult | { error: string };

      if (!response.ok) {
        setResult(null);
        setErrorMessage(
          "error" in payload ? payload.error : "Could not fetch dictionary data.",
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

    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: result.word,
          definition: selected.definition,
          partOfSpeech: selected.partOfSpeech,
          phonetic: result.phonetic,
          audioUrl: result.audioUrl,
        }),
      });

      const payload = (await response.json()) as SavedWord | { error: string };

      if (!response.ok) {
        setErrorMessage("error" in payload ? payload.error : "Could not save word.");
        return;
      }

      onWordSaved(payload as SavedWord);
      setQuery("");
      setResult(null);
      setSelectedDefinitionId("");
    } catch {
      setErrorMessage("Could not save word. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section id="find-word" className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a word (example: growth)"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-sky-500 focus:ring-2"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
      </section>

      {result && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{result.word}</h2>
              <p className="text-slate-600">
                {result.phonetic ? result.phonetic : "Phonetic not available"}
              </p>
            </div>
            <div className="flex gap-2">
              {result.audioUrl && (
                <audio controls src={result.audioUrl} className="h-10 w-60 max-w-full">
                  <track kind="captions" />
                </audio>
              )}
              <button
                type="button"
                onClick={() => playWordTts(result.word)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
              >
                Speak (Browser TTS)
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {result.meanings.length === 0 && (
              <p className="text-sm text-slate-500">No meanings returned for this word.</p>
            )}

            {result.meanings.map((meaning, meaningIndex) => (
              <div key={`${meaning.partOfSpeech}-${meaningIndex}`}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  {meaning.partOfSpeech}
                </h3>
                <ul className="mt-2 space-y-2">
                  {meaning.definitions.map((definition, definitionIndex) => {
                    const optionId = `${meaningIndex}-${definitionIndex}`;
                    return (
                      <li key={optionId} className="rounded-lg border border-slate-200 p-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="radio"
                            name="selectedDefinition"
                            value={optionId}
                            checked={selectedDefinitionId === optionId}
                            onChange={() => setSelectedDefinitionId(optionId)}
                            className="mt-1"
                          />
                          <span>{definition}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={saveSelectedDefinition}
            disabled={isSaving}
            className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
          >
            {isSaving ? "Saving..." : "Save selected meaning"}
          </button>
        </section>
      )}
    </>
  );
}
