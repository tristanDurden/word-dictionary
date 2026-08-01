"use client";

import { useSession } from "next-auth/react";

import SavedWords from "./components/SavedWords";
import SearchWord from "./components/SearchWord";

export default function Home() {
  const { data: session, status } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <>
      <header className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold md:text-3xl">Dictionary Learning App</h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          Search an English word to see meanings, phonetics, and pronunciation.
          {isSignedIn
            ? " Your saved words stay private to your account."
            : " Sign in with GitHub to keep your own dictionary."}
        </p>
      </header>

      <SearchWord canSave={isSignedIn} />

      {status === "loading" ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Loading your dictionary…</p>
        </section>
      ) : isSignedIn ? (
        <SavedWords />
      ) : (
        <section id="saved-words" className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Your dictionary</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with GitHub to save words and see your personal dictionary.
          </p>
        </section>
      )}
    </>
  );
}
