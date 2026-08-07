import { NextResponse } from "next/server";
import * as wordnet from "@/lib/services/wordnet";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = (searchParams.get("word") ?? "").trim().toLowerCase();

  if (!word) {
    return NextResponse.json(
      { error: "Please provide a word query parameter." },
      { status: 400 },
    );
  }

  try {
    const synonyms = wordnet.getSynonyms(word);

    return NextResponse.json({ synonyms });
  } catch {
    return NextResponse.json(
      { error: "Synonym service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
