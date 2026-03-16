import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { CreateWordPayload } from "@/lib/types";

export async function GET() {
  const words = await prisma.wordEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(words);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateWordPayload;

  const word = payload.word?.trim();
  const definition = payload.definition?.trim();
  const partOfSpeech = payload.partOfSpeech?.trim() || "unknown";

  if (!word || !definition) {
    return NextResponse.json(
      { error: "Both word and definition are required." },
      { status: 400 },
    );
  }

  const created = await prisma.wordEntry.create({
    data: {
      word,
      definition,
      partOfSpeech,
      phonetic: payload.phonetic?.trim() || null,
      audioUrl: payload.audioUrl?.trim() || null,
      exampleSentence: payload.exampleSentence?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
