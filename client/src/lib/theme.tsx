import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { isHearthApp } from "@/lib/app-mode";

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

function readTheme(key: string): Theme {
  const stored = localStorage.getItem(key);
  return stored === "dark" || stored === "light" ? stored : "dark";
}

function readAccent(key: string): AccentId {
  const stored = localStorage.getItem(key);
  return isAccent(stored) ? stored : "b";
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
  const [location] = useLocation();
  const hearth = location === "/hearth" || isHearthApp();
  const [wallTheme, setWallTheme] = useState<Theme>(() => readTheme("pidaka_theme"));
  const [wallAccent, setWallAccent] = useState<AccentId>(() => readAccent("pidaka_accent"));
  const [hearthTheme, setHearthTheme] = useState<Theme>(() => readTheme("pidaka_hearth_theme"));
  const [hearthAccent, setHearthAccent] = useState<AccentId>(() => readAccent("pidaka_hearth_accent"));

  const theme = hearth ? hearthTheme : wallTheme;
  const accent = hearth ? hearthAccent : wallAccent;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (hearth) localStorage.setItem("pidaka_hearth_theme", theme);
    else localStorage.setItem("pidaka_theme", theme);
  }, [theme, hearth]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    if (hearth) localStorage.setItem("pidaka_hearth_accent", accent);
    else localStorage.setItem("pidaka_accent", accent);
  }, [accent, hearth]);

  const toggleTheme = () => {
    const next = (prev: Theme) => (prev === "dark" ? "light" : "dark");
    if (hearth) setHearthTheme(next);
    else setWallTheme(next);
  };

  const cycleAccent = () => {
    const next = (current: AccentId) => {
      const index = ACCENT_IDS.indexOf(current);
      return ACCENT_IDS[(index + 1) % ACCENT_IDS.length];
    };
    if (hearth) setHearthAccent(next);
    else setWallAccent(next);
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
