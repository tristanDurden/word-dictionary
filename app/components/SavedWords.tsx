"use client";

import { useEffect } from "react";

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
    <p className="mt-1 text-sm text-slate-500">
      Practice: {latestOverallScore}/100
      {delta != null && (
        <>
          {" "}
          ({delta > 0 ? "+" : ""}
          {delta} vs last)
        </>
      )}
      {" · "}
      meaning {latestMeaningScore}/100
      {" · "}
      grammar {latestGrammarScore}/100
      {" · "}
      {attemptCount} attempt{attemptCount === 1 ? "" : "s"}
    </p>
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

  async function handleRemove(id: string) {
    const removed = await deleteWord(id);
    if (removed) {
      clearIfWordDeleted(id);
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
    <section id="saved-words" className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Saved words</h2>
      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="mt-2 text-sm text-slate-500">Loading saved words…</p>
      ) : dictionary.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No saved words yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {dictionary.map((item) => (
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
                {item.practice && item.practice.attemptCount > 0 && (
                  <PracticeProgress practice={item.practice} />
                )}
                {item.phonetic && (
                  <p className="text-sm text-slate-500">
                    Phonetic: {item.phonetic}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.audioUrl && (
                    <audio
                      controls
                      src={item.audioUrl}
                      className="h-10 w-60 max-w-full"
                    >
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
                onClick={() => void handleRemove(item.id)}
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
