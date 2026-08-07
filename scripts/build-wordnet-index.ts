/**
 * Build a game-friendly WordNet synonym index from OEWN 2025 JSON.
 *
 * Usage:
 *   npx tsx scripts/build-wordnet-index.ts
 *   npx tsx scripts/build-wordnet-index.ts --source /path/to/english-wordnet-2025-json
 *
 * Default source (in order):
 *   1. --source / OEWN_SOURCE env
 *   2. data/oewn-raw
 *   3. ~/Downloads/english-wordnet-2025-json
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_SYNONYMS = 5;
const MIN_LEMMA_LENGTH = 3;
const PLAYABLE_POS = new Set(["n", "v", "a"]);
const VERSION = "oewn-2025";

type SynsetRecord = {
  members?: string[];
  partOfSpeech?: string;
};

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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_PATH = join(ROOT, "data", "wordnet-index.json");

function parseArgs(argv: string[]): { source?: string } {
  const out: { source?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source" || arg === "-s") {
      out.source = argv[++i];
    } else if (arg.startsWith("--source=")) {
      out.source = arg.slice("--source=".length);
    }
  }
  return out;
}

function resolveSourceDir(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.OEWN_SOURCE,
    join(ROOT, "data", "oewn-raw"),
    join(homedir(), "Downloads", "english-wordnet-2025-json"),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error(
    [
      "OEWN JSON source directory not found.",
      "Pass --source <dir>, set OEWN_SOURCE, or place files at:",
      `  ${join(ROOT, "data", "oewn-raw")}`,
      `  ${join(homedir(), "Downloads", "english-wordnet-2025-json")}`,
    ].join("\n"),
  );
}

function normalizeLemma(raw: string): string {
  return raw.trim().toLowerCase().replaceAll("_", " ");
}

/** Single alphabetic token long enough for guessing (drops multiword, hyphen, digits). */
function isGameLemma(lemma: string): boolean {
  return /^[a-z]+$/.test(lemma) && lemma.length >= MIN_LEMMA_LENGTH;
}

function isNumericToken(lemma: string): boolean {
  return /^\d+$/.test(lemma);
}

function normalizePos(pos: string | undefined): string {
  if (!pos) return "?";
  // Satellite adjectives → adjective for game metadata
  return pos === "s" ? "a" : pos;
}

function listSynsetFiles(sourceDir: string): string[] {
  return readdirSync(sourceDir)
    .filter((name) => {
      if (!name.endsWith(".json")) return false;
      if (name === "frames.json") return false;
      if (name.startsWith("entries-")) return false;
      return true;
    })
    .map((name) => join(sourceDir, name))
    .sort();
}

function buildIndex(sourceDir: string): WordnetIndex {
  const synonymSets = new Map<string, Set<string>>();
  const posSynonymSets = new Map<string, Map<string, Set<string>>>();

  const files = listSynsetFiles(sourceDir);
  if (files.length === 0) {
    throw new Error(`No synset JSON files found in ${sourceDir}`);
  }

  let synsetCount = 0;
  let skippedNumericSynsets = 0;

  for (const file of files) {
    const synsets = JSON.parse(readFileSync(file, "utf8")) as Record<
      string,
      SynsetRecord
    >;

    for (const synset of Object.values(synsets)) {
      synsetCount += 1;
      const members = (synset.members ?? [])
        .map(normalizeLemma)
        .filter(Boolean);
      if (members.length < 2) continue;

      // Number / Roman-numeral synsets make poor game answers (ace↔1, iii↔three).
      if (members.some(isNumericToken)) {
        skippedNumericSynsets += 1;
        continue;
      }

      const pos = normalizePos(synset.partOfSpeech);
      const uniqueMembers = [...new Set(members)];
      const gameMembers = uniqueMembers.filter(isGameLemma);
      if (gameMembers.length < 2) continue;

      for (const lemma of gameMembers) {
        let set = synonymSets.get(lemma);
        if (!set) {
          set = new Set();
          synonymSets.set(lemma, set);
        }

        let byPos = posSynonymSets.get(lemma);
        if (!byPos) {
          byPos = new Map();
          posSynonymSets.set(lemma, byPos);
        }
        let posSet = byPos.get(pos);
        if (!posSet) {
          posSet = new Set();
          byPos.set(pos, posSet);
        }

        for (const other of gameMembers) {
          if (other === lemma) continue;
          set.add(other);
          posSet.add(other);
        }
      }
    }
  }

  const synonymsByLemma: Record<string, string[]> = {};
  for (const [lemma, set] of synonymSets) {
    if (set.size === 0) continue;
    synonymsByLemma[lemma] = [...set].sort((a, b) => a.localeCompare(b));
  }

  const playable: PlayableEntry[] = [];
  for (const [lemma, synonyms] of Object.entries(synonymsByLemma)) {
    if (synonyms.length < MIN_SYNONYMS) continue;

    const byPos = posSynonymSets.get(lemma);
    let bestPos = "n";
    let bestCount = -1;
    if (byPos) {
      for (const [pos, set] of byPos) {
        if (set.size > bestCount) {
          bestCount = set.size;
          bestPos = pos;
        }
      }
    }

    if (!PLAYABLE_POS.has(bestPos)) continue;

    playable.push({
      lemma,
      pos: bestPos,
      synonymCount: synonyms.length,
    });
  }

  playable.sort((a, b) => {
    if (b.synonymCount !== a.synonymCount) {
      return b.synonymCount - a.synonymCount;
    }
    return a.lemma.localeCompare(b.lemma);
  });

  console.log(
    `Parsed ${synsetCount} synsets from ${files.length} files ` +
      `(skipped ${skippedNumericSynsets} numeric) → ` +
      `${Object.keys(synonymsByLemma).length} lemmas, ` +
      `${playable.length} playable (≥${MIN_SYNONYMS} synonyms, POS n/v/a)`,
  );

  return {
    version: VERSION,
    synonymsByLemma,
    playable,
  };
}

async function writeIndex(path: string, index: WordnetIndex): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const sortedSynonyms: Record<string, string[]> = {};
  for (const lemma of Object.keys(index.synonymsByLemma).sort((a, b) =>
    a.localeCompare(b),
  )) {
    sortedSynonyms[lemma] = index.synonymsByLemma[lemma]!;
  }

  const payload: WordnetIndex = {
    version: index.version,
    synonymsByLemma: sortedSynonyms,
    playable: index.playable,
  };

  writeFileSync(path, `${JSON.stringify(payload)}\n`, "utf8");
}

async function main(): Promise<void> {
  const { source } = parseArgs(process.argv.slice(2));
  const sourceDir = resolveSourceDir(source);
  console.log(`Source: ${sourceDir}`);
  console.log(`Output: ${OUT_PATH}`);

  const index = buildIndex(sourceDir);
  await writeIndex(OUT_PATH, index);

  const bytes = readFileSync(OUT_PATH).byteLength;
  console.log(
    `Wrote ${OUT_PATH} (${(bytes / (1024 * 1024)).toFixed(2)} MB)`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
