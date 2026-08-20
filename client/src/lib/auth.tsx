import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

interface UserData {
  anonymousName: string;
  burnsSentCount: number;
  burnsReceivedCount: number;
  unreadCount: number;
}

interface SessionPayload {
  token?: string;
  user: UserData & { unreadCount?: number };
  created?: boolean;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  justNamed: string | null;
  authError: string | null;
  completeSession: (data: SessionPayload) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearJustNamed: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justNamed, setJustNamed] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const namedRef = useRef(false);

  const applyUser = useCallback((userData: UserData, created?: boolean) => {
    localStorage.removeItem("pidaka_token");
    setToken("cookie");
    setUser({ ...userData, unreadCount: userData.unreadCount ?? 0 });
    if (created) setJustNamed(userData.anonymousName);
  }, []);

  const refreshUser = useCallback(async () => {
    const leftover = localStorage.getItem("pidaka_token");
    const headers: Record<string, string> = {};
    if (leftover) headers.Authorization = `Bearer ${leftover}`;
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.removeItem("pidaka_token");
        setUser({ ...userData, unreadCount: userData.unreadCount ?? 0 });
        setToken("cookie");
        if (namedRef.current) {
          setJustNamed(userData.anonymousName);
          namedRef.current = false;
        }
      } else {
        localStorage.removeItem("pidaka_token");
        setUser(null);
        setToken(null);
      }
    } catch {
      localStorage.removeItem("pidaka_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inbound = params.get("token");
    const named = params.get("named");
    const error = params.get("authError");
    if (error) {
      setAuthError(error === "apple" ? "Apple sign-in did not finish." : "Google sign-in did not finish.");
    }
    if (named === "1") namedRef.current = true;
    if (inbound) {
      localStorage.setItem("pidaka_token", inbound);
    }
    if (inbound || named || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("named");
      url.searchParams.delete("authError");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    void refreshUser();
  }, [refreshUser]);

  const completeSession = (data: SessionPayload) => {
    applyUser({ ...data.user, unreadCount: data.user.unreadCount ?? 0 }, data.created);
  };

  const logout = async () => {
    localStorage.removeItem("pidaka_token");
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // still leave
    }
    setToken(null);
    setUser(null);
    setJustNamed(null);
  };

  const clearJustNamed = useCallback(() => setJustNamed(null), []);
  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      justNamed,
      authError,
      completeSession,
      logout,
      refreshUser,
      clearJustNamed,
      clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
