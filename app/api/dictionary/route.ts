import { NextResponse } from "next/server";

import type { DictionaryResult } from "@/lib/types";

type DictionaryApiDefinition = {
  definition: string;
};

type DictionaryApiMeaning = {
  partOfSpeech?: string;
  definitions?: DictionaryApiDefinition[];
};

type DictionaryApiPhonetic = {
  text?: string;
  audio?: string;
};

type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: DictionaryApiPhonetic[];
  meanings?: DictionaryApiMeaning[];
};

type FallbackPronunciation = {
  type?: string;
  text?: string;
};

type FallbackSense = {
  definition?: string;
};

type FallbackEntry = {
  partOfSpeech?: string;
  pronunciations?: FallbackPronunciation[];
  senses?: FallbackSense[];
};

type FallbackResponse = {
  word?: string;
  entries?: FallbackEntry[];
};

function normalizeWord(input: string): string {
  return input.trim().toLowerCase();
}

function fromPrimary(data: DictionaryApiEntry[], word: string): DictionaryResult | null {
  const firstEntry = data[0];
  if (!firstEntry) {
    return null;
  }

  const phoneticFromList = firstEntry.phonetics?.find((item) => item.text?.trim());
  const audioFromList = firstEntry.phonetics?.find((item) => item.audio?.trim());

  return {
    word: firstEntry.word ?? word,
    phonetic: firstEntry.phonetic ?? phoneticFromList?.text ?? "",
    audioUrl: audioFromList?.audio ?? "",
    meanings: (firstEntry.meanings ?? []).map((meaning) => ({
      partOfSpeech: meaning.partOfSpeech ?? "unknown",
      definitions: (meaning.definitions ?? [])
        .map((definition) => definition.definition)
        .filter(Boolean),
    })),
  };
}

function fromFallback(data: FallbackResponse, word: string): DictionaryResult | null {
  const entries = data.entries ?? [];
  if (entries.length === 0) {
    return null;
  }

  const phonetic =
    entries
      .flatMap((entry) => entry.pronunciations ?? [])
      .find((item) => item.text?.trim())?.text ?? "";

  const meaningsByPos = new Map<string, string[]>();

  for (const entry of entries) {
    const partOfSpeech = entry.partOfSpeech ?? "unknown";
    const definitions = (entry.senses ?? [])
      .map((sense) => sense.definition?.trim() ?? "")
      .filter(Boolean);

    if (definitions.length === 0) {
      continue;
    }

    const existing = meaningsByPos.get(partOfSpeech) ?? [];
    meaningsByPos.set(partOfSpeech, [...existing, ...definitions]);
  }

  const meanings = Array.from(meaningsByPos.entries()).map(([partOfSpeech, definitions]) => ({
    partOfSpeech,
    definitions,
  }));

  if (meanings.length === 0) {
    return null;
  }

  return {
    word: data.word ?? word,
    phonetic,
    audioUrl: "",
    meanings,
  };
}

async function fetchPrimary(word: string): Promise<DictionaryResult | null> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as DictionaryApiEntry[];
  return fromPrimary(data, word);
}

async function fetchFallback(word: string): Promise<DictionaryResult | null> {
  const response = await fetch(
    `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as FallbackResponse;
  return fromFallback(data, word);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawWord = searchParams.get("word") ?? "";
  const word = normalizeWord(rawWord);

  if (!word) {
    return NextResponse.json(
      { error: "Please provide a word query parameter." },
      { status: 400 },
    );
  }

  try {
    const primary = await fetchPrimary(word).catch(() => null);
    const result = primary ?? (await fetchFallback(word));

    if (!result) {
      return NextResponse.json(
        { error: `No dictionary result found for "${word}".` },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Dictionary service is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
