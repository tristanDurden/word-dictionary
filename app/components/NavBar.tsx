"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <a href="#" className="text-lg font-bold text-slate-900">
          Word Dictionary
        </a>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:gap-4">
          <a href="#find-word" className="hidden hover:text-sky-700 sm:inline">
            Find a word
          </a>
          <a href="#saved-words" className="hidden hover:text-sky-700 sm:inline">
            Saved words
          </a>

          {status === "loading" ? (
            <span className="text-slate-400">…</span>
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden max-w-28 truncate text-slate-600 sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github")}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
