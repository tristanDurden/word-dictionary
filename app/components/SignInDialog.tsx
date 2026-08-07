"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Provider = "google" | "github";

const AUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already linked to another sign-in method. Use the provider you signed up with.",
  EmailRequired:
    "Your provider did not share an email address. Make your email public (GitHub) or use another account, then try again.",
  OAuthCallback:
    "Sign-in failed during the provider callback. Please try again.",
  Default: "Sign-in failed. Please try again.",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.5.4-2.7 2.1C5.1 19.5 8.3 21.4 12 21.4c2.9 0 5.3-.9 7.1-2.5l-3.1-2.4c-.9.6-2 1-3.9 1-3 0-5.5-2-6.4-4.7z"
      />
      <path
        fill="#4A90E2"
        d="M3.4 7.2C2.5 9 2.5 11 2.5 12s0 3 .9 4.8l3.2-2.5c-.2-.6-.3-1.2-.3-2.3s.1-1.7.3-2.3L3.4 7.2z"
      />
      <path
        fill="#FBBC05"
        d="M12 4.6c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.3 1.4 14.9.6 12 .6 8.3.6 5.1 2.5 3.4 5.6l3.2 2.5C7.5 6.6 10 4.6 12 4.6z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

type SignInDialogProps = {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function SignInDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: SignInDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userOpen, setUserOpen] = useState(false);
  const [pending, setPending] = useState<Provider | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const urlError = errorParam
    ? (AUTH_ERRORS[errorParam] ?? AUTH_ERRORS.Default)
    : null;
  const error = signInError ?? urlError;

  const isControlled = controlledOpen !== undefined;
  const open = isControlled
    ? controlledOpen
    : userOpen || Boolean(urlError);

  function setOpen(next: boolean) {
    if (!isControlled) setUserOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setSignInError(null);
      if (errorParam) {
        router.replace(pathname, { scroll: false });
      }
    }
  }

  async function handleSignIn(provider: Provider) {
    setPending(provider);
    setSignInError(null);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      setSignInError(AUTH_ERRORS.Default);
      setPending(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Choose a provider. One email maps to one account — Google and GitHub
            with the same address share the same dictionary.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            disabled={pending !== null}
            onClick={() => handleSignIn("google")}
          >
            {pending === "google" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="justify-start gap-3"
            disabled={pending !== null}
            onClick={() => handleSignIn("github")}
          >
            {pending === "github" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <GitHubIcon className="size-5" />
            )}
            Continue with GitHub
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
