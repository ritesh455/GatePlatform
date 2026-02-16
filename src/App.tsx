// src/App.tsx

"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, BookOpen, BarChart3, Settings, Menu, X } from 'lucide-react';
// 🛑 IMPORTANT: Use React Router DOM for routing as per your new App.tsx
import { 
    BrowserRouter, 
    Routes, 
    Route, 
    Navigate, 
    useNavigate, 
    useLocation 
} from 'react-router-dom';

// FIX: Assuming AuthContext.tsx exports { AuthProvider, useAuth }
import { AuthProvider, useAuth } from './contexts/AuthContext'; 
// Assuming DataProvider is the name of your data context provider
import { DataProvider as AppDataProvider } from './contexts/DataContext'; 

// --- IMPORT ALL PAGES/COMPONENTS ---
import HomePage from './pages/HomePage'; 
import LoginPage from './pages/LoginPage'; 
import RegisterPage from './pages/RegisterPage'; 
import NotFound from './pages/NotFound';
import SystemAdmin from './pages/SystemAdmin'; // From New App.tsx

// --- IMPORT EXISTING APP COMPONENTS (kept for reference) ---
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudyMaterials from './components/StudyMaterials';
import MockTests from './components/MockTests';
import Progress from './components/Progress';
import AdminPanel from './components/AdminPanel';
import ChapterManagement from './components/ChapterManagement';
// ------------------------------------
import PaperManagement from './components/PaperManagement';

// --- ROUTING CONSTANTS ---
const ADMIN_LOGIN_PATH = '/system-admin/login';


// Determine the valid type for the view state (used internally in AppContent)
type ViewName = 'dashboard' | 'admin' | 'chapters' | 'study' | 'tests' | 'progress'| 'papers';


// 1. AppContent (Your Original Authenticated Dashboard UI)
// 🛑 The internal view state logic ('currentView') of the old AppContent is REMOVED
// and replaced by the current URL path using useLocation().
// The components that used to be rendered by the switch statement are now
// direct routes in the AppRouter, simplifying AppContent to just the shell.

function AppContent() {
    // We only need the Header/Sidebar shell, as the content renders via <Outlet> or <Routes>
    const { user, logoutUser } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    
    // Fallback/Safety Check (Shouldn't happen if wrapped in ProtectedRoute)
    if (!user) return <Navigate to="/login" replace />; 

    // Extract the view ID from the current path for highlighting the sidebar item
    const currentPath = location.pathname.split('/')[1] || 'dashboard';

    const userNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        { id: 'chapters', label: 'Subjects', icon: BookOpen, path: '/chapters' },
        { id: 'study', label: 'Study Materials', icon: BookOpen, path: '/study' },
        { id: 'tests', label: 'Mock Tests', icon: Settings, path: '/tests' },
        { id: 'progress', label: 'Progress', icon: BarChart3, path: '/progress' },
        // { id: 'papers', label: 'Papers', icon: BookOpen, path: '/papers' },
    ];

    const adminNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        { id: 'admin', label: 'Admin Panel', icon: Settings, path: '/admin' },
        { id: 'chapters', label: 'Subjects', icon: BookOpen, path: '/chapters' },
        { id: 'study', label: 'Study Materials', icon: BookOpen, path: '/study' },
        { id: 'tests', label: 'Mock Tests', icon: Settings, path: '/tests' },
        // { id: 'papers', label: 'Papers', icon: BookOpen, path: '/papers' },
    ];

    const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            <h1
                                onClick={() => { /* In a Router setup, clicking here should navigate */ }}
                                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer ml-3 lg:ml-0"
                            >
                                Path2Gate
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <User size={20} className="text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">
                                    {user.name} ({user.role})
                                </span>
                            </div>
                            <button
                                onClick={logoutUser} 
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out`}>
                    <div className="flex flex-col h-full pt-16 lg:pt-0">
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {navItems.map((item) => (
                                <SidebarButton
                                    key={item.id}
                                    item={item}
                                    isActive={currentPath === item.id}
                                    setSidebarOpen={setSidebarOpen}
                                />
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content: This is where the React Router <Route> children will render */}
                <div className="flex-1 lg:ml-0">
                    <main className="p-6">
                        {/* We use React Router's <Routes> inside AppRouter instead of renderAuthenticatedContent() */}
                        <AuthenticatedRoutes /> 
                    </main>
                </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}

// Helper component to use useNavigate
const SidebarButton = ({ item, isActive, setSidebarOpen }: { item: any, isActive: boolean, setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) => {
    const navigate = useNavigate();
    
    return (
        <button
            key={item.id}
            onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
            <item.icon size={20} className="mr-3" />
            {item.label}
        </button>
    );
};

// 2. ProtectedRoute (Guards authenticated routes)
const ProtectedRoute: React.FC<{ element: React.ReactNode, requiredRole?: 'admin' | 'student' }> = ({ element, requiredRole }) => {
    const { user, authLoading } = useAuth();
    const location = useLocation();

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-slate-600">Loading application...</p>
            </div>
        );
    }
    
    if (!user) {
        // Redirect unauthenticated users to login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // Redirect users without the required role (e.g., student trying to access /admin)
        return <Navigate to="/dashboard" replace />;
    }

    return element;
};

// 3. AuthenticatedRoutes (The content of the dashboard area)
const AuthenticatedRoutes = () => {
    const { user } = useAuth();
    if (!user) return null; // Should be caught by ProtectedRoute, but safety first.

    return (
        <Routes>
            {/* Student/Admin Routes (Shared and role-specific) */}
            <Route path="/dashboard" element={user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />} />
            <Route path="/chapters" element={<ChapterManagement />} />
            <Route path="/study" element={<StudyMaterials />} />
            <Route path="/tests" element={<MockTests />} />
            {/* <Route path="/papers" element={<PaperManagement />} /> */}
            
            {/* Student-only route */}
            {user.role === 'student' && <Route path="/progress" element={<Progress />} />}

            {/* Admin-only route */}
            {user.role === 'admin' && <Route path="/admin" element={<AdminPanel />} />}
            
            {/* Catch-all for unknown authenticated paths */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};


// 4. AppRouter (Handles all top-level routing and context nesting)
function AppRouter() {
    const { user, authLoading } = useAuth();
    const location = useLocation();
    // 🛑 FIX: You must call the useNavigate hook inside the component function
    const navigate = useNavigate(); 

    // Redirect logic from old code: Logged-in users are sent away from /login or /register
    useEffect(() => {
        const path = location.pathname.toLowerCase();
        if (user && (path === '/login' || path === '/register')) {
            // Use navigate to change the URL history in React Router DOM
            navigate('/dashboard', { replace: true });
        }
    }, [user, location.pathname, navigate]); // Add navigate to dependency array
    
    // If loading, show loading screen
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-slate-600">Loading application...</p>
            </div>
        );
    }

    // This is the core routing table
    return (
        <Routes>
            {/* --- Public Routes --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* --- SystemAdmin Routes (from New App.tsx) --- */}
            <Route path="/system-admin/*" element={<SystemAdmin />} />
            
            {/* --- Authenticated Routes (from Old App.tsx) --- */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute element={
                        <AppDataProvider>
                            <AppContent />
                        </AppDataProvider>
                    } />
                }
            />

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

// 5. Main App Wrapper
function App() {
    return (
        <React.StrictMode>
            {/* 1. AuthProvider is the outermost context */}
            <AuthProvider> 
                {/* 2. BrowserRouter is required for React Router DOM */}
                <BrowserRouter>
                    {/* 3. AppRouter handles all routing and provider nesting */}
                    <AppRouter />
                </BrowserRouter>
            </AuthProvider>
        </React.StrictMode>
    );
}

export default App;