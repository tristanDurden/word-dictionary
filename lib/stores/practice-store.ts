import { create } from "zustand";

import type { PracticeEvaluation, SavedWord } from "@/lib/types";
import { useWordsStore } from "@/lib/stores/words-store";

type PracticeStoreState = {
  currentWord: SavedWord | null;
  answer: string;
  evaluation: PracticeEvaluation | null;
  statusMessage: string | null;
  isSubmitting: boolean;
};

type PracticeStoreActions = {
  setAnswer: (answer: string) => void;
  pickRandomWord: () => Promise<void>;
  submitAnswer: () => Promise<void>;
  resetPractice: () => void;
  clearIfWordDeleted: (wordId: string) => void;
};

type PracticeStore = PracticeStoreState & PracticeStoreActions;

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  currentWord: null,
  answer: "",
  evaluation: null,
  statusMessage: null,
  isSubmitting: false,

  setAnswer: (answer) => set({ answer }),

  resetPractice: () =>
    set({
      currentWord: null,
      answer: "",
      evaluation: null,
      statusMessage: null,
      isSubmitting: false,
    }),

  clearIfWordDeleted: (wordId) => {
    const { currentWord } = get();
    if (currentWord?.id !== wordId) {
      return;
    }

    set({
      currentWord: null,
      answer: "",
      evaluation: null,
      statusMessage: "That word was removed from your dictionary.",
      isSubmitting: false,
    });
  },

  pickRandomWord: async () => {
    // Read the shared dictionary — do not copy it into this store.
    let words = useWordsStore.getState().dictionary;

    if (words.length === 0) {
      await useWordsStore.getState().fetchDictionary();
      words = useWordsStore.getState().dictionary;
    }

    if (words.length === 0) {
      set({
        currentWord: null,
        statusMessage: "No saved words to practice yet.",
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * words.length);
    set({
      currentWord: words[randomIndex],
      answer: "",
      evaluation: null,
      statusMessage: null,
    });
  },

  submitAnswer: async () => {
    const { currentWord, answer } = get();

    if (!currentWord) {
      set({ statusMessage: "Pick a word before submitting." });
      return;
    }

    if (!answer.trim()) {
      set({ statusMessage: "Write an answer before submitting." });
      return;
    }

    set({ isSubmitting: true, statusMessage: null });

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: currentWord.id,
          answer,
        }),
      });

      const payload = (await response.json()) as
        | { evaluation?: PracticeEvaluation; error?: string }
        | undefined;

      if (response.status === 401) {
        set({
          evaluation: null,
          statusMessage: "Sign in to submit an answer.",
          isSubmitting: false,
        });
        return;
      }

      if (!response.ok) {
        set({
          evaluation: null,
          statusMessage: payload?.error ?? "Could not submit answer.",
          isSubmitting: false,
        });
        return;
      }

      set({
        evaluation: payload?.evaluation ?? null,
        isSubmitting: false,
      });

      // Refresh dictionary so Saved Words shows updated progress.
      void useWordsStore.getState().fetchDictionary();
    } catch {
      set({
        evaluation: null,
        statusMessage: "Could not submit answer.",
        isSubmitting: false,
      });
    }
  },
}));
