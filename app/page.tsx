"use client";

import { useSession } from "next-auth/react";
import { Search } from "lucide-react";

import SavedWords from "./components/SavedWords";
import DictionaryTabs from "./components/Tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchDialogStore } from "@/lib/stores/search-dialog-store";

export default function Home() {
  const { data: session, status } = useSession();
  const isSignedIn = Boolean(session?.user);
  const openSearch = useSearchDialogStore((state) => state.open);

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

      <Button size="lg" onClick={openSearch} className="w-fit">
        <Search data-icon="inline-start" />
        Look up a word
      </Button>

      {status === "loading" ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
        </Card>
      ) : isSignedIn ? (
        <div className="space-y-4">
          <DictionaryTabs />
          <SavedWords />
        </div>
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
