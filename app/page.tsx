"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import NavBar from "./components/NavBar";
import SavedWords from "./components/SavedWords";
import SearchWord from "./components/SearchWord";

export default function Home() {
  const { data: session, status } = useSession();
  const [refreshSavedWordsToken, setRefreshSavedWordsToken] = useState(0);
  const isSignedIn = Boolean(session?.user);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <NavBar />
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold md:text-3xl">Dictionary Learning App</h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Search an English word to see meanings, phonetics, and pronunciation.
            {isSignedIn
              ? " Your saved words stay private to your account."
              : " Sign in with GitHub to keep your own dictionary."}
          </p>
        </header>

        <SearchWord
          canSave={isSignedIn}
          onWordSaved={() => setRefreshSavedWordsToken((currentValue) => currentValue + 1)}
        />

        {status === "loading" ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading your dictionary…</p>
          </section>
        ) : isSignedIn ? (
          <SavedWords refreshToken={refreshSavedWordsToken} />
        ) : (
          <section id="saved-words" className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Your dictionary</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with GitHub to save words and see your personal dictionary.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
