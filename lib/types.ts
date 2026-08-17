export type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: string[];
};

export type DictionaryResult = {
  word: string;
  phonetic: string;
  audioUrl: string;
  meanings: DictionaryMeaning[];
};

export type CreateWordPayload = {
  word?: string;
  definition?: string;
  partOfSpeech?: string;
  phonetic?: string;
  audioUrl?: string;
  exampleSentence?: string;
  folderId?: string | null;
  isFinished?: boolean;
};

export type GrammarMistake = {
  mistake: string;
  correction: string;
  explanation: string;
};

export type PracticeEvaluation = {
  meaning: {
    score: number;
    feedback: string;
  };
  grammar: {
    score: number;
    feedback: string;
    mistakes: GrammarMistake[];
  };
  overallScore: number;
  summary: string;
};

export type WordPracticeProgress = {
  attemptCount: number;
  latestOverallScore: number | null;
  latestMeaningScore: number | null;
  latestGrammarScore: number | null;
  previousOverallScore: number | null;
  
};

export type SavedWord = {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  createdAt: string;
  folderId: string | null;
  isFinished: boolean;
  practice?: WordPracticeProgress;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** Id for tabs */
export type FolderTabId = "all" | "finished" | string;