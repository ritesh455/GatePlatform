// src/contexts/AuthContext.tsx

"use client"

import React, { 
    createContext, 
    useContext, 
    useState, 
    ReactNode, 
    useEffect, 
    useMemo, 
    useCallback 
} from "react";

// --- 1. Define the User and AuthResult Types (From Old Context) ---

export interface User {
    id: string;
    email: string;
    name: string;
    token: string;
    role: 'student' | 'admin';
    username?: string;
    branch?: string;
    city?: string;
    state?: string;
    gender?: string;
    phone?: string;
    userNo?: string;
    adminNo?: string;
}

// Define the shape of the result for API calls (matches LoginPage expectation)
export type AuthResult = { success: true; data: User } | { success: false; error: string };


// --- 2. Define the Full Auth Context Shape (Combined) ---
interface AuthContextValue {
    // Old Context properties for full user data and loading states
    user: User | null; // The authenticated user object or null
    loading: boolean; // Loading for login/register actions
    authLoading: boolean; // Specific loading state for initial user load (was in Old)
    error: string | null;
    registerUser: (fd: FormData) => Promise<AuthResult>;
    loginUser: (payload: { email: string; password: string }) => Promise<AuthResult>;
    logoutUser: () => void;
    
    // System Admin specific login (accepts token directly)
    loginWithToken: (token: string) => void;
    
    // New Context properties for simplified access
    isAuthenticated: boolean; // Derived state
    // Note: The 'login' and 'logout' from the new context are replaced by 
    // 'loginUser' and 'logoutUser' for full functionality.
}

// Rename context to AuthContext
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- 3. Custom Hook with Guard Clause ---
/**
 * Custom hook to access authentication data and functions.
 * @returns {AuthContextValue} The context value.
 */
export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};

// --- 4. The Provider Component (Combined Logic) ---

// Assuming backend runs on port 5000
const API_BASE_URL = "https://gateplatform.onrender.com/api/auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    // Old Context States
    const [user, setUser] = useState<User | null>(null); // State for the authenticated user
    const [loading, setLoading] = useState(false); // Loading for login/register actions
    const [authLoading, setAuthLoading] = useState(true); // Loading for initial context load
    const [error, setError] = useState<string | null>(null);

    // Initial check to load user from storage (Old Context's useEffect)
    useEffect(() => {
        const token = localStorage.getItem("userToken");
        const storedUser = localStorage.getItem("user");
        if (token && storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                parsedUser.token = token; 
                setUser(parsedUser);
            } catch (e) {
                console.error("Error parsing stored user data:", e);
                localStorage.removeItem("userToken");
                localStorage.removeItem("user");
            }
        }
        setAuthLoading(false);
    }, []);

    // API Functions (using useCallback for performance, as in New Context style)

    const loginUser = useCallback(async (payload: { email: string; password: string }): Promise<AuthResult> => {
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
                const msg = data?.message || "Login failed.";
                setError(msg);
                return { success: false, error: msg };
            }
            
            // Map backend response to User interface (from Old Context logic)
            const loggedInUser: User = { 
                id: data.user?.id || data.id,
                email: data.user?.email || data.email,
                name: data.user?.username || data.user?.name || "User",
                token: data.token,
                role: data.user?.role || data.role,
                username: data.user?.username,
                branch: data.user?.branch,
                city: data.user?.city,
                state: data.user?.state,
                gender: data.user?.gender,
                phone: data.user?.phone,
                userNo: data.user?.user_no,
                adminNo: data.user?.admin_no,
            };
            
            // Save user data to state and storage
            localStorage.setItem("userToken", loggedInUser.token);
            localStorage.setItem("user", JSON.stringify(loggedInUser));
            setUser(loggedInUser);

            return { success: true, data: loggedInUser };
        } catch (err: any) {
            const msg = err?.message || "Network error. Check if the server is running.";
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, []);

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
                const msg = data?.message || "Registration failed.";
                setError(msg);
                return { success: false, error: msg };
            }

            // Check if this is an admin registration (request_status will be 'pending', no token)
            const isAdminPending = data.user?.request_status === 'pending' && !data.token;

            if (isAdminPending) {
                // Admin registration pending approval - do NOT log in automatically
                return { success: true, data: data.user };
            }

            // Map backend response to User interface (for student or approved admin)
            const registeredUser: User = {
                id: data.user?.id || data.id,
                email: data.user?.email || data.email,
                name: data.user?.username || data.user?.name || "User",
                token: data.token || "", // May be empty for pending admins
                role: data.user?.role || data.role,
                username: data.user?.username,
                branch: data.user?.branch,
                city: data.user?.city,
                state: data.user?.state,
                gender: data.user?.gender,
                phone: data.user?.phone,
                userNo: data.user?.user_no,
                adminNo: data.user?.admin_no,
            };

            // Only save to localStorage if we have a token (user is authenticated)
            if (data.token) {
                localStorage.setItem("userToken", registeredUser.token);
                localStorage.setItem("user", JSON.stringify(registeredUser));
                setUser(registeredUser);
            }

            return { success: true, data: registeredUser };
        } catch (err: any) {
            const msg = err?.message || "Network error during registration.";
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    const logoutUser = useCallback(() => {
        setUser(null);
        localStorage.removeItem("userToken");
        localStorage.removeItem("user");
        
        // Old Context's specific redirect logic for SPA router updates
        if (typeof window !== 'undefined') {
            try {
                window.history.replaceState({}, '', '/');
                window.dispatchEvent(new Event('popstate'));
            } catch (e) {
                // ignore
            }
        }
    }, []);

    // System Admin login - accepts a token directly (no email/password needed)
    const loginWithToken = useCallback((token: string) => {
        // Store the token and create a minimal user object for system admin
        localStorage.setItem("userToken", token);
        const systemAdminUser: User = {
            id: "system-admin",
            email: "system-admin@path2gate.com",
            name: "System Admin",
            token: token,
            role: "admin",
            username: "system-admin",
        };
        localStorage.setItem("user", JSON.stringify(systemAdminUser));
        setUser(systemAdminUser);
    }, []);

    // Derived state from New Context
    const isAuthenticated = !!user;

    // Memoize the context value for performance (from New Context style)
    const contextValue = useMemo(() => ({
        user,
        authLoading, 
        loading, 
        error, 
        registerUser, 
        loginUser, 
        logoutUser,
        loginWithToken,
        isAuthenticated, // Added from New Context
    }), [user, authLoading, loading, error, registerUser, loginUser, logoutUser, loginWithToken, isAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};