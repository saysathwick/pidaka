import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface UserData {
  anonymousName: string;
  burnsSentCount: number;
  burnsReceivedCount: number;
  unreadCount: number;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  justNamed: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearJustNamed: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pidaka_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [justNamed, setJustNamed] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("pidaka_token");
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser({ ...userData, unreadCount: userData.unreadCount ?? 0 });
        setToken(storedToken);
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
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    localStorage.setItem("pidaka_token", data.token);
    setToken(data.token);
    setUser({ ...data.user, unreadCount: data.user.unreadCount ?? 0 });
  };

  const register = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { email, password });
    const data = await res.json();
    localStorage.setItem("pidaka_token", data.token);
    setToken(data.token);
    setUser({ ...data.user, unreadCount: data.user.unreadCount ?? 0 });
    setJustNamed(data.user.anonymousName);
  };

  const logout = () => {
    localStorage.removeItem("pidaka_token");
    setToken(null);
    setUser(null);
    setJustNamed(null);
  };

  const clearJustNamed = useCallback(() => setJustNamed(null), []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, justNamed, login, register, logout, refreshUser, clearJustNamed }}>
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
