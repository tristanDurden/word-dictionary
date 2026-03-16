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

export type SavedWord = {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  phonetic: string | null;
  audioUrl: string | null;
  createdAt: string;
};

export type CreateWordPayload = {
  word?: string;
  definition?: string;
  partOfSpeech?: string;
  phonetic?: string;
  audioUrl?: string;
  exampleSentence?: string;
};
