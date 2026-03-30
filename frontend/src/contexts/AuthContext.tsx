// src/contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";

// --- Types ---
export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  role: "student" | "admin";
  username?: string;
  branch?: string;
  city?: string;
  state?: string;
  gender?: string;
  phone?: string;
  userNo?: string;
  adminNo?: string;
}

export type AuthResult =
  | { success: true; data: User }
  | { success: false; error: string };

// --- Context Type ---
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authLoading: boolean;
  error: string | null;

  registerUser: (fd: FormData) => Promise<AuthResult>;
  loginUser: (payload: {
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  logoutUser: () => void;

  loginWithToken: (token: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Hook ---
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// --- API ---
const API_BASE_URL = "https://gateplatform.onrender.com/api/auth";

// --- Provider ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Load user safely
  useEffect(() => {
    try {
      const token = localStorage.getItem("userToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser({ ...parsedUser, token });
      }
    } catch (e) {
      console.error("Invalid stored user:", e);
      localStorage.clear();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ✅ Login
  const loginUser = useCallback(
    async (payload: { email: string; password: string }): Promise<AuthResult> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          const msg = data?.message || "Login failed";
          setError(msg);
          return { success: false, error: msg };
        }

        const userData = data.user || data;

        const loggedInUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.username || userData.name || "User",
          token: data.token,
          role: userData.role,
          username: userData.username,
          branch: userData.branch,
          city: userData.city,
          state: userData.state,
          gender: userData.gender,
          phone: userData.phone,
          userNo: userData.user_no,
          adminNo: userData.admin_no,
        };

        localStorage.setItem("userToken", loggedInUser.token);
        localStorage.setItem("user", JSON.stringify(loggedInUser));

        setUser(loggedInUser);

        return { success: true, data: loggedInUser };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Network error. Server might be down.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ✅ Register
  const registerUser = useCallback(async (formData: FormData): Promise<AuthResult> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || "Registration failed";
        setError(msg);
        return { success: false, error: msg };
      }

      const userData = data.user || data;

      if (userData?.request_status === "pending" && !data.token) {
        return { success: true, data: userData };
      }

      const newUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.username || userData.name || "User",
        token: data.token || "",
        role: userData.role,
      };

      if (data.token) {
        localStorage.setItem("userToken", newUser.token);
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
      }

      return { success: true, data: newUser };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Logout
  const logoutUser = useCallback(() => {
    setUser(null);
    localStorage.clear();
  }, []);

  // ✅ Token login
  const loginWithToken = useCallback((token: string) => {
    const systemUser: User = {
      id: "system-admin",
      email: "system-admin@path2gate.com",
      name: "System Admin",
      token,
      role: "admin",
    };

    localStorage.setItem("userToken", token);
    localStorage.setItem("user", JSON.stringify(systemUser));

    setUser(systemUser);
  }, []);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      loading,
      authLoading,
      error,
      registerUser,
      loginUser,
      logoutUser,
      loginWithToken,
      isAuthenticated,
    }),
    [user, loading, authLoading, error, registerUser, loginUser, logoutUser, loginWithToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};