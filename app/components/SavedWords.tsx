"use client";

import { useEffect, useState } from "react";
import type { SavedWord } from "@/lib/types";

type SavedWordsProps = {
  refreshToken: number;
};

export default function SavedWords({ refreshToken }: SavedWordsProps) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchSavedWords() {
      try {
        const response = await fetch("/api/words", { cache: "no-store" });
        if (!response.ok) {
          setErrorMessage("Could not load saved words.");
          return;
        }

        const payload = (await response.json()) as SavedWord[];
        setSavedWords(payload);
      } catch {
        setErrorMessage("Could not load saved words.");
      }
    }

    void fetchSavedWords();
  }, [refreshToken]);

  function playWordTts(word: string) {
    if (!word.trim()) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  async function removeSavedWord(id: string) {
    try {
      const response = await fetch(`/api/words/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setErrorMessage("Could not remove saved word.");
        return;
      }

      setSavedWords((previous) => previous.filter((item) => item.id !== id));
      setErrorMessage("");
    } catch {
      setErrorMessage("Could not remove saved word.");
    }
  }

  return (
    <section id="saved-words" className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Saved words</h2>
      {errorMessage && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {savedWords.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No saved words yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {savedWords.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <p className="font-semibold">
                  {item.word}{" "}
                  <span className="font-normal text-slate-500">
                    ({item.partOfSpeech || "unknown"})
                  </span>
                </p>
                <p className="text-sm text-slate-700">{item.definition}</p>
                {item.phonetic && (
                  <p className="text-sm text-slate-500">Phonetic: {item.phonetic}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.audioUrl && (
                    <audio controls src={item.audioUrl} className="h-10 w-60 max-w-full">
                      <track kind="captions" />
                    </audio>
                  )}
                  <button
                    type="button"
                    onClick={() => playWordTts(item.word)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    Speak
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSavedWord(item.id)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
