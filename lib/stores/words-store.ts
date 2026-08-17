import { create } from "zustand";

import type { Folder, FolderTabId, SavedWord } from "@/lib/types";

type WordsStoreState = {
  dictionary: SavedWord[];
  folders: Folder[];
  selectedTabId: FolderTabId;
  error: string | null;
  isLoading: boolean;
  isFoldersLoading: boolean;
};

type WordsStoreActions = {
  setDictionary: (dictionary: SavedWord[]) => void;
  setSelectedTabId: (tabId: FolderTabId) => void;
  addWord: (word: SavedWord) => void;
  removeWordById: (id: string) => void;
  updateWord: (word: SavedWord) => void;
  fetchDictionary: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder | null>;
  renameFolder: (id: string, name: string) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  createWord: (payload: {
    word: string;
    definition: string;
    partOfSpeech: string;
    phonetic?: string;
    audioUrl?: string;
    folderId?: string | null;
    isFinished?: boolean;
  }) => Promise<SavedWord | null>;
  moveWord: (id: string, folderId: string | null) => Promise<boolean>;
  setWordFinished: (id: string, isFinished: boolean) => Promise<boolean>;
  deleteWord: (id: string) => Promise<boolean>;
  clearError: () => void;
  getFilteredDictionary: () => SavedWord[];
};

type WordsStore = WordsStoreState & WordsStoreActions;

export const useWordsStore = create<WordsStore>((set, get) => ({
  dictionary: [],
  folders: [],
  selectedTabId: "all",
  error: null,
  isLoading: false,
  isFoldersLoading: false,

  setDictionary: (dictionary) => set({ dictionary }),

  setSelectedTabId: (tabId) => set({ selectedTabId: tabId }),

  addWord: (word) =>
    set((state) => ({ dictionary: [word, ...state.dictionary] })),

  removeWordById: (id) =>
    set((state) => ({
      dictionary: state.dictionary.filter((entry) => entry.id !== id),
    })),

  updateWord: (word) =>
    set((state) => ({
      dictionary: state.dictionary.map((entry) =>
        entry.id === word.id
          ? { ...entry, ...word, practice: word.practice ?? entry.practice }
          : entry,
      ),
    })),

  clearError: () => set({ error: null }),

  getFilteredDictionary: () => {
    const { dictionary, selectedTabId } = get();
    if (selectedTabId === "all") {
      return dictionary;
    }
    if (selectedTabId === "finished") {
      return dictionary.filter((word) => word.isFinished);
    }
    return dictionary.filter(
      (word) => word.folderId === selectedTabId && !word.isFinished,
    );
  },

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

  fetchFolders: async () => {
    set({ isFoldersLoading: true });

    try {
      const response = await fetch("/api/folders", { cache: "no-store" });

      if (response.status === 401) {
        set({ folders: [], isFoldersLoading: false });
        return;
      }

      if (!response.ok) {
        set({
          error: "Could not load folders.",
          isFoldersLoading: false,
        });
        return;
      }

      const folders = (await response.json()) as Folder[];
      set({ folders, isFoldersLoading: false });
    } catch {
      set({ error: "Could not load folders.", isFoldersLoading: false });
    }
  },

  createFolder: async (name) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const body = (await response.json()) as Folder | { error: string };

      if (!response.ok) {
        set({
          error: "error" in body ? body.error : "Could not create folder.",
        });
        return null;
      }

      const folder = body as Folder;
      set((state) => ({
        folders: [...state.folders, folder],
        selectedTabId: folder.id,
        error: null,
      }));
      return folder;
    } catch {
      set({ error: "Could not create folder." });
      return null;
    }
  },

  renameFolder: async (id, name) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const body = (await response.json()) as Folder | { error: string };

      if (!response.ok) {
        set({
          error: "error" in body ? body.error : "Could not rename folder.",
        });
        return null;
      }

      const folder = body as Folder;
      set((state) => ({
        folders: state.folders.map((entry) =>
          entry.id === id ? folder : entry,
        ),
        error: null,
      }));
      return folder;
    } catch {
      set({ error: "Could not rename folder." });
      return null;
    }
  },

  deleteFolder: async (id) => {
    try {
      const response = await fetch(`/api/folders/${id}`, { method: "DELETE" });

      if (!response.ok) {
        set({ error: "Could not delete folder." });
        return false;
      }

      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        dictionary: state.dictionary.map((word) =>
          word.folderId === id ? { ...word, folderId: null } : word,
        ),
        selectedTabId:
          state.selectedTabId === id ? "all" : state.selectedTabId,
        error: null,
      }));
      return true;
    } catch {
      set({ error: "Could not delete folder." });
      return false;
    }
  },

  createWord: async (payload) => {
    try {
      const { selectedTabId } = get();
      const folderId =
        payload.folderId !== undefined
          ? payload.folderId
          : selectedTabId !== "all" && selectedTabId !== "finished"
            ? selectedTabId
            : null;
      const isFinished =
        payload.isFinished !== undefined
          ? payload.isFinished
          : selectedTabId === "finished";

      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, folderId, isFinished }),
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

  moveWord: async (id, folderId) => {
    try {
      const response = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      const body = (await response.json()) as SavedWord | { error: string };

      if (!response.ok) {
        set({
          error: "error" in body ? body.error : "Could not move word.",
        });
        return false;
      }

      const word = body as SavedWord;
      get().updateWord(word);
      set({ error: null });
      return true;
    } catch {
      set({ error: "Could not move word." });
      return false;
    }
  },

  setWordFinished: async (id, isFinished) => {
    try {
      const response = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinished }),
      });

      const body = (await response.json()) as SavedWord | { error: string };

      if (!response.ok) {
        set({
          error: "error" in body ? body.error : "Could not update word.",
        });
        return false;
      }

      const word = body as SavedWord;
      get().updateWord(word);
      set({ error: null });
      return true;
    } catch {
      set({ error: "Could not update word." });
      return false;
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
