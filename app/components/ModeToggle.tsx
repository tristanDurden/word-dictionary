"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

function useIsDark() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 100);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return {
    isDark,
    toggle: () => setTheme(isDark ? "light" : "dark"),
  };
}

export function ModeToggle() {
  const { isDark, toggle } = useIsDark();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative hidden sm:inline-flex"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

export function ModeToggleMenuItem() {
  const { isDark, toggle } = useIsDark();

  return (
    <DropdownMenuItem className="sm:hidden" onClick={toggle}>
      {isDark ? <Sun /> : <Moon />}
      {isDark ? "Light mode" : "Dark mode"}
    </DropdownMenuItem>
  );
}
