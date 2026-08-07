"use client";

import { useSession } from "next-auth/react";

import SavedWords from "./components/SavedWords";
import SearchWord from "./components/SearchWord";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: session, status } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <>
      <header className="space-y-2 px-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          Word Dictionary
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-100 md:text-base">
          Search an English word to see meanings, phonetics, and pronunciation.
          {isSignedIn
            ? " Your saved words stay private to your account."
            : " Sign in with Google or GitHub to keep your own dictionary."}
        </p>
      </header>

      <SearchWord canSave={isSignedIn} />

      {status === "loading" ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>
      ) : isSignedIn ? (
        <SavedWords />
      ) : (
        <Card id="saved-words">
          <CardHeader>
            <CardTitle>Your dictionary</CardTitle>
            <CardDescription>
              Sign in with Google or GitHub to save words and see your personal
              dictionary.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
