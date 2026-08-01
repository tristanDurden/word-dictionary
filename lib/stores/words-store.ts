import { create } from "zustand";

import type { SavedWord } from "@/lib/types";

type WordsStoreState = {
  dictionary: SavedWord[];
  error: string | null;
  isLoading: boolean;
};

type WordsStoreActions = {
  setDictionary: (dictionary: SavedWord[]) => void;
  addWord: (word: SavedWord) => void;
  removeWordById: (id: string) => void;
  fetchDictionary: () => Promise<void>;
  createWord: (payload: {
    word: string;
    definition: string;
    partOfSpeech: string;
    phonetic?: string;
    audioUrl?: string;
  }) => Promise<SavedWord | null>;
  deleteWord: (id: string) => Promise<boolean>;
  clearError: () => void;
};

type WordsStore = WordsStoreState & WordsStoreActions;

export const useWordsStore = create<WordsStore>((set, get) => ({
  dictionary: [],
  error: null,
  isLoading: false,

  setDictionary: (dictionary) => set({ dictionary }),

  addWord: (word) =>
    set((state) => ({ dictionary: [word, ...state.dictionary] })),

  removeWordById: (id) =>
    set((state) => ({
      dictionary: state.dictionary.filter((entry) => entry.id !== id),
    })),

  clearError: () => set({ error: null }),

  fetchDictionary: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/words", { cache: "no-store" });

      if (response.status === 401) {
        set({
          dictionary: [],
          error: "Sign in to load your saved words.",
          isLoading: false,
        });
        return;
      }

      if (!response.ok) {
        set({ error: "Could not load saved words.", isLoading: false });
        return;
      }

      const dictionary = (await response.json()) as SavedWord[];
      set({ dictionary, isLoading: false });
    } catch {
      set({ error: "Could not load saved words.", isLoading: false });
    }
  },

  createWord: async (payload) => {
    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as SavedWord | { error: string };

      if (!response.ok) {
        set({
          error: "error" in body ? body.error : "Could not save word.",
        });
        return null;
      }

      const word = body as SavedWord;
      get().addWord(word);
      return word;
    } catch {
      set({ error: "Could not save word. Please try again." });
      return null;
    }
  },

  deleteWord: async (id) => {
    try {
      const response = await fetch(`/api/words/${id}`, { method: "DELETE" });

      if (!response.ok) {
        set({ error: "Could not remove saved word." });
        return false;
      }

      get().removeWordById(id);
      set({ error: null });
      return true;
    } catch {
      set({ error: "Could not remove saved word." });
      return false;
    }
  },
}));
