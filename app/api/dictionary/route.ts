import { NextResponse } from "next/server";

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

function normalizeWord(input: string): string {
  return input.trim().toLowerCase();
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

  const dictionaryResponse = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!dictionaryResponse.ok) {
    return NextResponse.json(
      { error: `No dictionary result found for "${word}".` },
      { status: dictionaryResponse.status === 404 ? 404 : 502 },
    );
  }

  const data = (await dictionaryResponse.json()) as DictionaryApiEntry[];
  const firstEntry = data[0];

  if (!firstEntry) {
    return NextResponse.json(
      { error: `No dictionary result found for "${word}".` },
      { status: 404 },
    );
  }

  const phoneticFromList = firstEntry.phonetics?.find((item) => item.text?.trim());
  const audioFromList = firstEntry.phonetics?.find((item) => item.audio?.trim());

  const result = {
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

  return NextResponse.json(result);
}
