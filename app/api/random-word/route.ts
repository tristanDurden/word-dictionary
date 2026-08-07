import { requireUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as wordnet from "@/lib/services/wordnet";

const VALID_DIFFICULTIES = new Set(["1", "2", "3", "4", "5"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { error } = await requireUserId();
  if (error) {
    return error;
  }

  const difficulty = searchParams.get("difficulty");
  if (!difficulty || !VALID_DIFFICULTIES.has(difficulty)) {
    return NextResponse.json(
      { error: "Difficulty must be a number from 1 to 5." },
      { status: 400 },
    );
  }

  try {
    const randomWord = wordnet.getRandomPlayableWord(Number(difficulty));

    if (!randomWord) {
      return NextResponse.json(
        { error: "No word returned." },
        { status: 502 },
      );
    }

    return NextResponse.json({ word: randomWord }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch random word." },
      { status: 502 },
    );
  }
}
