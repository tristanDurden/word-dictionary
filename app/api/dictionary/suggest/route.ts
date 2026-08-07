import { NextResponse } from "next/server";

type DatamuseSuggestion = {
  word?: string;
  score?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.datamuse.com/sug?s=${encodeURIComponent(query)}&max=8`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Suggestion service is temporarily unavailable." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as DatamuseSuggestion[];
    const suggestions = data
      .map((item) => item.word?.trim().toLowerCase())
      .filter((word): word is string => Boolean(word));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "Suggestion service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
