import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";

export const ACCENTS = [
  { id: "b", name: "Copper coal" },
  { id: "c", name: "Match ochre" },
  { id: "d", name: "Night indigo" },
  { id: "e", name: "Dried wine" },
  { id: "a", name: "Tangerine" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

const ACCENT_IDS = ACCENTS.map((accent) => accent.id);

function isAccent(value: string | null): value is AccentId {
  return ACCENT_IDS.includes(value as AccentId);
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accent: AccentId;
  accentName: string;
  cycleAccent: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("pidaka_theme");
    return stored === "dark" || stored === "light" ? stored : "dark";
  });
  const [accent, setAccent] = useState<AccentId>(() => {
    const stored = localStorage.getItem("pidaka_accent");
    return isAccent(stored) ? stored : "b";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("pidaka_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("pidaka_accent", accent);
  }, [accent]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const cycleAccent = () => {
    setAccent((current) => {
      const index = ACCENT_IDS.indexOf(current);
      return ACCENT_IDS[(index + 1) % ACCENT_IDS.length];
    });
  };

  const accentName = ACCENTS.find((item) => item.id === accent)?.name ?? "Copper coal";

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, accentName, cycleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
