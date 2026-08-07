import Link from "next/link";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border/80 bg-card/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between md:px-8">
        <div className="space-y-1">
          <p className="font-heading text-foreground">Word Dictionary</p>
          <p>© {YEAR} Word Dictionary. All rights reserved.</p>
        </div>

        <div className="max-w-md space-y-2 md:text-right">
          <p>
            Synonym data from{" "}
            <a
              href="https://en-word.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
            >
              Open English Wordnet
            </a>{" "}
            (OEWN), derived from Princeton WordNet.
          </p>
          <p>
            Licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
            >
              Creative Commons Attribution 4.0 International
            </a>
            .
          </p>
          <p>
            <Link
              href="/synonyms"
              className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
            >
              Synonyms game
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
