import wordnetIndex from "@/data/wordnet-index.json" with { type: "json" };

type PlayableEntry = {
  lemma: string;
  pos: string;
  synonymCount: number;
};

type WordnetIndex = {
  version: string;
  synonymsByLemma: Record<string, string[]>;
  playable: PlayableEntry[];
};

const index = wordnetIndex as WordnetIndex;

/** Cap sense-union lists so rounds stay guessable. */
const MAX_SYNONYMS_FOR_GAME = 12;

/**
 * Difficulty bands (tuned via smoke tests):
 * 1 easy → short lemmas, many synonyms
 * 5 hard → longer lemmas, fewer synonyms
 */
function matchesDifficulty(
  entry: PlayableEntry,
  difficulty: number,
): boolean {
  const { synonymCount } = entry;
  const len = entry.lemma.length;

  switch (difficulty) {
    case 1:
      return len <= 6 && synonymCount >= 12 && synonymCount <= 24;
    case 2:
      return len <= 8 && synonymCount >= 9 && synonymCount <= 16;
    case 3:
      return len >= 4 && len <= 10 && synonymCount >= 7 && synonymCount <= 12;
    case 4:
      return len >= 6 && synonymCount >= 5 && synonymCount <= 9;
    case 5:
      return len >= 8 && synonymCount >= 5 && synonymCount <= 7;
    default:
      return synonymCount >= 5;
  }
}

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replaceAll("_", " ");
}

export function getSynonyms(word: string): string[] {
  const synonyms = index.synonymsByLemma[normalize(word)] ?? [];
  if (synonyms.length <= MAX_SYNONYMS_FOR_GAME) {
    return synonyms;
  }
  return synonyms.slice(0, MAX_SYNONYMS_FOR_GAME);
}

export function getRandomPlayableWord(difficulty: number): string | null {
  const pool = index.playable.filter((entry) =>
    matchesDifficulty(entry, difficulty),
  );

  if (pool.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex]?.lemma ?? null;
}
