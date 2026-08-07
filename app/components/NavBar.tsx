"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import SignInDialog from "./SignInDialog";

const links = [
  { href: "/", label: "Find a word" },
  { href: "/#saved-words", label: "Saved words" },
  { href: "/practice", label: "Practice" },
  { href: "/synonyms", label: "Synonyms" },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-10 rounded-xl border border-border/80 bg-card/90 px-3 py-2.5 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/75">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Word Dictionary
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const isActive =
                !link.href.includes("#") && pathname === link.href;

              return (
                <Button
                  key={link.href + link.label}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              );
            })}
          </div>

          {status === "loading" ? (
            <Skeleton className="size-8 rounded-full" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar size="sm">
                    {session.user.image && (
                      <AvatarImage
                        src={session.user.image}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <AvatarFallback>
                      {(session.user.name ?? session.user.email ?? "U")
                        .slice(0, 1)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">
                    {session.user.name ?? "Signed in"}
                  </p>
                  {session.user.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map((link) => {
                  return (
                    <DropdownMenuItem
                      key={link.href}
                      className="sm:hidden"
                      asChild
                    >
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Suspense fallback={<Button size="sm">Sign in</Button>}>
              <SignInDialog trigger={<Button size="sm">Sign in</Button>} />
            </Suspense>
          )}
        </div>
      </div>
    </nav>
  );
}
