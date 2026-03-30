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
import { SocketProvider } from './contexts/SocketContext';

import UserProfile from './components/UserProfile';

// --- IMPORT ALL PAGES/COMPONENTS ---
import HomePage from './screens/HomePage'; 
import LoginPage from './screens/LoginPage'; 
import RegisterPage from './screens/RegisterPage'; 
import NotFound from './screens/NotFound';
import SystemAdmin from './screens/SystemAdmin'; // From New App.tsx

// --- IMPORT EXISTING APP COMPONENTS (kept for reference) ---
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudyMaterials from './components/StudyMaterials';
import MockTests from './components/MockTests';
import Progress from './components/Progress';
import AdminPanel from './components/AdminPanel';
import ChapterManagement from './components/ChapterManagement';
import MaterialView from "./components/MaterialView"
import TestHistory from "./components/TestHistory";
import GateChatbot from "./components/GateChatbot";
import CommunityPage from './screens/CommunityPage';
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
        // { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'chapters', label: 'Subjects', icon: BookOpen, path: '/chapters' },
        { id: 'study', label: 'Study Materials', icon: BookOpen, path: '/study' },
        { id: 'tests', label: 'Mock Tests', icon: Settings, path: '/tests' },
        { id: 'progress', label: 'Progress', icon: BarChart3, path: '/progress' },
        { id: 'chatbot', label: 'Ask Anything', icon: BookOpen, path: '/chatbot' },
        { id: 'community', label: 'Community', icon: User, path: '/community' },
        
        // { id: 'papers', label: 'Papers', icon: BookOpen, path: '/papers' },
    ];

    const adminNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        //  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'admin', label: 'Admin Panel', icon: Settings, path: '/admin' },
        { id: 'chapters', label: 'Subjects', icon: BookOpen, path: '/chapters' },
        { id: 'study', label: 'Study Materials', icon: BookOpen, path: '/study' },
        { id: 'tests', label: 'Mock Tests', icon: Settings, path: '/tests' },
        { id: 'history', label: 'Test History', icon: BarChart3, path: '/history' },
        // { id: 'papers', label: 'Papers', icon: BookOpen, path: '/papers' },
    ];

    const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

return (
  <div className="h-screen flex flex-col bg-slate-100">

    {/* HEADER */}
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="flex justify-between items-center h-16 px-6">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <h1 className="text-xl font-bold">
            Path<span className="text-green-600">2Gate</span>
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <User size={18} />
            {user.name} ({user.role})
          </div>

          <button
            onClick={logoutUser}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>

        </div>

      </div>
    </header>


    <div className="flex flex-1 overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300`}
      >

        <nav className="p-4 pt-6 space-y-2">

          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              item={item}
              isActive={currentPath === item.id}
              setSidebarOpen={setSidebarOpen}
            />
          ))}

        </nav>

      </aside>


      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">

        <main className="p-6 max-w-7xl mx-auto">

          <AuthenticatedRoutes />

        </main>

      </div>
    </div>


    {/* MOBILE OVERLAY */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-40 lg:hidden"
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
    onClick={() => {
      navigate(item.path);
      setSidebarOpen(false);
    }}
    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition
      ${
        isActive
          ? "bg-green-600 text-white shadow"
          : "text-slate-700 hover:bg-slate-100"
      }`}
  >
    <item.icon size={18} className="mr-3" />
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
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/chapters" element={<ChapterManagement />} />
            <Route path="/study" element={<StudyMaterials />} />
            <Route path="/study/:id" element={<MaterialView />} />
            <Route path="/tests" element={<MockTests />} />
            <Route path="/chatbot" element={<GateChatbot />} />
            <Route path="/history" element={<TestHistory />} />
            <Route path="/community" element={<CommunityPage />} />
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
               <SocketProvider>
                {/* 2. BrowserRouter is required for React Router DOM */}
                <BrowserRouter>
                    {/* 3. AppRouter handles all routing and provider nesting */}
                    <AppRouter />
                </BrowserRouter>
                </SocketProvider>
            </AuthProvider>
        </React.StrictMode>
    );
}

export default App;