import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { dropBurnSubscription } from "@/lib/push-client";
import { apiUrl, isNativeApp } from "@/lib/api-base";
import { listenForNativeOAuthReturn, type OAuthReturnParams } from "@/lib/native-auth";

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

  const applyUser = useCallback((userData: UserData, nextToken?: string, created?: boolean) => {
    if (isNativeApp() && nextToken) {
      localStorage.setItem("pidaka_token", nextToken);
      setToken(nextToken);
    } else if (!isNativeApp()) {
      localStorage.removeItem("pidaka_token");
      setToken("cookie");
    }
    setUser({ ...userData, unreadCount: userData.unreadCount ?? 0 });
    if (created) setJustNamed(userData.anonymousName);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("pidaka_token");
    const headers: Record<string, string> = {};
    if (storedToken) headers.Authorization = `Bearer ${storedToken}`;
    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        credentials: isNativeApp() ? "omit" : "include",
        headers,
      });
      if (res.ok) {
        const userData = await res.json();
        if (isNativeApp() && storedToken) {
          setToken(storedToken);
        } else if (!isNativeApp()) {
          localStorage.removeItem("pidaka_token");
          setToken("cookie");
        }
        setUser({ ...userData, unreadCount: userData.unreadCount ?? 0 });
        if (namedRef.current) {
          setJustNamed(userData.anonymousName);
          namedRef.current = false;
        }
      } else if (storedToken) {
        localStorage.removeItem("pidaka_token");
        setUser(null);
        setToken(null);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      if (storedToken) localStorage.removeItem("pidaka_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyOAuthReturn = useCallback((params: OAuthReturnParams) => {
    if (params.authError) {
      setAuthError(
        params.authError === "apple"
          ? "Apple sign-in did not finish."
          : "Google sign-in did not finish.",
      );
    }
    if (params.named) namedRef.current = true;
    if (params.token) localStorage.setItem("pidaka_token", params.token);
    setIsLoading(true);
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    applyOAuthReturn({
      token: params.get("token"),
      named: params.get("named") === "1",
      authError: params.get("authError"),
    });
    if (params.get("token") || params.get("named") || params.get("authError")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.searchParams.delete("named");
      url.searchParams.delete("authError");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [applyOAuthReturn]);

  useEffect(() => {
    return listenForNativeOAuthReturn(applyOAuthReturn);
  }, [applyOAuthReturn]);

  const completeSession = (data: SessionPayload) => {
    applyUser(
      { ...data.user, unreadCount: data.user.unreadCount ?? 0 },
      data.token,
      data.created,
    );
  };

  const logout = async () => {
    const storedToken = localStorage.getItem("pidaka_token");
    localStorage.removeItem("pidaka_token");
    await dropBurnSubscription();
    try {
      const headers: Record<string, string> = {};
      if (storedToken) headers.Authorization = `Bearer ${storedToken}`;
      await fetch(apiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: isNativeApp() ? "omit" : "include",
        headers,
      });
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
