
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = root.classList.contains("dark") ? "dark" : "light";
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("dark");
      setTheme("dark");
    } else {
      root.classList.remove("dark");
      setTheme("light");
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl h-9 w-9 text-muted-foreground hover:text-primary">
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
