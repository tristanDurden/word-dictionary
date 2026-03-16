"use client";

import { useState } from "react";
import NavBar from "./components/NavBar";
import SavedWords from "./components/SavedWords";
import SearchWord from "./components/SearchWord";

export default function Home() {
  const [refreshSavedWordsToken, setRefreshSavedWordsToken] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <NavBar />
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold md:text-3xl">Dictionary Learning App</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Search an English word to see meanings, phonetics, and pronunciation.
          </p>
        </header>

        <SearchWord
          onWordSaved={() => setRefreshSavedWordsToken((currentValue) => currentValue + 1)}
        />
        <SavedWords refreshToken={refreshSavedWordsToken} />
      </main>
    </div>
  );
}
