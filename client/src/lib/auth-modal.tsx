import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AuthModalContextType {
  authOpen: boolean;
  showAuth: () => void;
  hideAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const showAuth = useCallback(() => setAuthOpen(true), []);
  const hideAuth = useCallback(() => setAuthOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ authOpen, showAuth, hideAuth }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
