"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BookOpen, Users, UserCog, User, BarChart2, CheckCircle, XCircle, Ban, Trash2, Search, Filter, Mail, Phone, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';

// Import the necessary Auth hook
import { useAuth } from '../contexts/AuthContext';
// Import the new Admin Data Context and types
import { useAdminData, Admin, Student, AdminDataProvider } from '../contexts/AdminDataContext';


// --- INTERFACES & TYPE DEFINITIONS ---

// Define the required structure for chart data
export interface BranchData {
    name: string;
    students: number;
    fill: string;
}

// --- CONSTANTS ---

// Only keep constants necessary for display and filtering
export const BRANCH_OPTIONS = ['All Branches', 'CSE', 'DS', 'EE', 'CIVIL', 'ENTC']; // Added ENTC as per SQL schema
export const BRANCH_COLORS: Record<string, string> = {
    'CSE': '#4F46E5', // Indigo-600
    'DS': '#8B5CF6', // Violet-500
    'EE': '#EC4899', // Pink-500
    'CIVIL': '#10B981', // Emerald-500
    'ENTC': '#F59E0B', // Amber-500
    'Other': '#94A3B8' // Slate-400 for null/other branches
};

// --- DATA PROCESSING UTILITY (Now uses real data structure) ---
export const calculateBranchData = (students: Student[]): BranchData[] => {
    const counts = students.reduce((acc, student) => {
        const branchKey = (student.branch || 'Other') as keyof typeof BRANCH_COLORS;
        acc[branchKey] = (acc[branchKey] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).map(branch => ({
        name: branch,
        students: counts[branch] || 0,
        fill: BRANCH_COLORS[branch] || BRANCH_COLORS['Other']
    }));
};

// --- UTILITY COMPONENTS ---

// Custom Tooltip component for Recharts
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-md text-sm">
                <p className="font-semibold text-slate-800">{`${label} Branch`}</p>
                <p className="text-gray-600">{`Students: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

// Custom Modal for Sub-Admin Actions (Requires admin ID to be string or number)
export const AdminActionModal: React.FC<{ 
    admin: Admin | null; 
    onClose: () => void; 
    onStatusChange: (id: number | string, status: Admin['request_status']) => Promise<void> 
}> = ({ admin, onClose, onStatusChange }) => {
    if (!admin) return null;

    const [isUpdating, setIsUpdating] = useState(false);

    const StatusIcon = {
        pending: <UserCog className="w-6 h-6 text-yellow-500" />,
        accepted: <CheckCircle className="w-6 h-6 text-green-500" />,
        rejected: <XCircle className="w-6 h-6 text-red-500" />,
        blocked: <Ban className="w-6 h-6 text-gray-500" />,
    }[admin.request_status] || <UserCog className="w-6 h-6 text-gray-400" />;

    const handleStatusUpdate = async (newStatus: Admin['request_status']) => {
        setIsUpdating(true);
        try {
            await onStatusChange(admin.id, newStatus);
            onClose(); // Close only on success
        } catch (error) {
            console.error("Failed to update status in modal:", error);
            // Error feedback could be added here
        } finally {
            setIsUpdating(false);
        }
    };

    // NOTE: phone and degree_file fields are not present in the Admin interface from AdminContext.tsx
    const mockAdminPhone = "N/A";
    const mockDegreeFile = "N/A"; 

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Sub-Admin Details: {admin.username}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-lg font-semibold">
                        Status:
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                            admin.request_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            admin.request_status === 'accepted' ? 'bg-green-100 text-green-800' :
                            admin.request_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {StatusIcon} {admin.request_status.toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <p className="font-medium flex items-center gap-2"><User className="w-4 h-4 text-blue-500"/>Username: <span className="font-normal">{admin.username}</span></p>
                        <p className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500"/>Email: <span className="font-normal">{admin.email}</span></p>
                        <p className="font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500"/>Phone: <span className="font-normal">{mockAdminPhone}</span></p>
                        <a
                            href="#" 
                            className="font-medium flex items-center gap-2 text-blue-600 hover:text-purple-600 transition-colors"
                            onClick={(e) => { e.preventDefault(); /* Use custom modal instead of alert*/ }}
                        >
                            <FileText className="w-4 h-4"/> View Degree File
                        </a>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="flex items-center gap-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-all shadow-md" disabled={isUpdating}>
                        Cancel
                    </button>
                    
                    {admin.request_status !== 'accepted' && (
                        <button
                            onClick={() => handleStatusUpdate('accepted')}
                            className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Updating...' : <><CheckCircle className="w-5 h-5" /> Accept</>}
                        </button>
                    )}

                    {admin.request_status !== 'blocked' && (
                        <button
                            onClick={() => handleStatusUpdate('blocked')}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all shadow-md disabled:opacity-50"
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Updating...' : <><Ban className="w-5 h-5" /> Block</>}
                        </button>
                    )}

{admin.request_status !== 'rejected' && (
    <button
        onClick={() => handleStatusUpdate('rejected')}
        className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-md disabled:opacity-50"
        disabled={isUpdating}
    >
        {isUpdating ? 'Updating...' : <><XCircle className="w-5 h-5" /> Reject</>}
    </button>
)}
                </div>
            </div>
        </div>
    );
};

// KPI Card Component
const KPICard: React.FC<{ title: string; value: number; icon: React.ReactNode; bgColor: string }> = ({ title, value, icon, bgColor }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]">
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor} text-white`}>
            {icon}
        </div>
    </div>
);

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <svg className="animate-spin h-10 w-10 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-slate-700">Loading Admin Dashboard Data...</p>
    </div>
);

// --- LOGIN PAGE COMPONENT (FIXED SIGNATURE) ---
// Now expects a function that takes the token, matching the global auth.login(token) signature.
export const AdminLoginPage: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);
    
      try {
        const response = await fetch('https://gateplatform.onrender.com/api/system-admin/login', { 
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ email, password }),
       });
    
       const data = await response.json();
       
       // FIX: Call onLogin with the received token/data after success
       if (response.ok && data.success && data.token) {
        localStorage.setItem("systemAdminToken", data.token);
        window.location.reload();
       } else {
         setError(data.message || 'Login failed. Please check your credentials.');
       }
     } catch (err) {
       setError('Connection error. Could not reach the backend API.');
     } finally {
       setIsLoading(false);
     }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                {/* Header */}
                <div className="p-8 text-center border-b border-gray-100">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Path2Gate
                        </span>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700">System Admin Login</h2>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg border border-red-300">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="xyz@example.com"
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-shadow disabled:bg-gray-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition-shadow disabled:bg-gray-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.01] shadow-lg shadow-purple-200 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging In...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="p-4 text-center text-xs text-gray-500 border-t border-gray-100">
                    For system admin only.
                </div>
            </div>
        </div>
    );
};

// 1. Dashboard Section (KPIs and Chart)
export const DashboardSection: React.FC<{ admins: Admin[]; students: Student[]; branchData: BranchData[] }> = ({ admins, students, branchData }) => {
    const pendingAdmins = admins.filter(a => a.request_status === 'pending').length;
    const totalStudents = students.length;
    const totalAdmins = admins.length;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">System Overview</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Students"
                    value={totalStudents}
                    icon={<Users className="w-6 h-6" />}
                    bgColor="bg-blue-500"
                />
                <KPICard
                    title="Total Sub-Admins"
                    value={totalAdmins}
                    icon={<UserCog className="w-6 h-6" />}
                    bgColor="bg-purple-500"
                />
                <KPICard
                    title="Pending Approvals"
                    value={pendingAdmins}
                    icon={<User className="w-6 h-6" />}
                    bgColor="bg-yellow-500"
                />
                <KPICard
                    title="Active Branches"
                    value={branchData.filter(d => d.students > 0).length}
                    icon={<BarChart2 className="w-6 h-6" />}
                    bgColor="bg-emerald-500"
                />
            </div>

            {/* Branch Distribution Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                <h3 className="text-xl font-semibold mb-4 text-slate-800">Student Distribution by Branch</h3>
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={branchData}
                                dataKey="students"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                            >
                                {branchData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// 2. Sub-Admin Management Section
export const AdminManagementSection: React.FC = () => {
    const { admins, updateAdminStatus } = useAdminData();
    const [adminFilter, setAdminFilter] = useState<'pending' | 'accepted' | 'rejected' | 'blocked'>('pending');
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

    const filteredAdmins = useMemo(() => {
        return admins.filter(admin => admin.request_status === adminFilter);
    }, [admins, adminFilter]);

    const handleView = useCallback((admin: Admin) => {
        setSelectedAdmin(admin);
    }, []);

    const handleStatusChange = useCallback(async (adminId: number | string, newStatus: Admin['request_status']) => {
        const success = await updateAdminStatus(adminId, newStatus);
        if (!success) {
            console.error("Failed to update status via API.");
        }
        setSelectedAdmin(null);
    }, [updateAdminStatus]);

    const getStatusClasses = (status: Admin['request_status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'blocked': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-50 text-gray-700';
        }
    };

    const statusTabs: Admin['request_status'][] = ['pending', 'accepted', 'rejected', 'blocked'];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Sub-Admin Management</h2>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {statusTabs.map(status => (
                    <button
                        key={status}
                        onClick={() => setAdminFilter(status)}
                        className={`px-4 py-2 font-semibold capitalize rounded-t-lg transition-colors duration-200 ${
                            adminFilter === status
                                ? 'bg-white border-b-2 border-purple-500 text-purple-600'
                                : 'text-gray-500 hover:text-purple-500'
                        }`}
                    >
                        {status} ({admins.filter(a => a.request_status === status).length})
                    </button>
                ))}
            </div>

            {/* Sub-Admin Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['ID', 'Username', 'Email', 'Role', 'Status', 'Action'].map(header => (
                                <th
                                    key={header}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredAdmins.length > 0 ? (
                            filteredAdmins.map(admin => (
                                <tr key={admin.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{admin.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{admin.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClasses(admin.request_status)}`}>
                                            {admin.request_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleView(admin)}
                                            className="text-blue-600 hover:text-purple-600 font-semibold transition-colors"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No {adminFilter.toUpperCase()} sub-admin requests found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AdminActionModal
                admin={selectedAdmin}
                onClose={() => setSelectedAdmin(null)}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
};

// 3. Student Management Section
export const StudentManagementSection: React.FC = () => {
    const { students, deleteStudent } = useAdminData();
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('All Branches');

    const filteredStudents = useMemo(() => {
        return students
            .filter(student =>
                branchFilter === 'All Branches' || student.branch === branchFilter
            )
            .filter(student =>
                (student.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                student.email?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
    }, [students, branchFilter, searchTerm]);

    const handleDelete = useCallback(async (studentId: number) => {
        // NOTE: Using alert/confirm temporarily. Replace with custom modal later.
        if (window.confirm(`Are you sure you want to delete student ID ${studentId}? This action cannot be undone.`)) {
            const success = await deleteStudent(studentId);
            if (success) {
                console.log(`Student ${studentId} deleted successfully.`);
            } else {
                // NOTE: Replacing alert() with console.error as per instruction
                console.error(`Failed to delete student ${studentId}. Check console for details.`);
            }
        }
    }, [deleteStudent]);
    
    const tableHeaders = ['ID', 'Username', 'Branch', 'Email', 'City/State', 'Action'];

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Student Management</h2>

            {/* Controls: Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                </div>

                <div className="relative w-full sm:w-48">
                    <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white cursor-pointer focus:ring-purple-500 focus:border-purple-500"
                    >
                        {BRANCH_OPTIONS.map(branch => (
                            <option key={branch} value={branch}>{branch}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {tableHeaders.map(header => (
                                <th
                                    key={header}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.username}</td>
                                    <td 
                                        className="px-6 py-4 whitespace-nowrap text-sm font-semibold" 
                                        style={{ color: BRANCH_COLORS[student.branch || 'Other'] }}
                                    >
                                        {student.branch || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {student.city || 'N/A'}, {student.state || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(student.id)} 
                                            className="text-red-600 hover:text-red-800 font-semibold transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableHeaders.length} className="px-6 py-4 text-center text-gray-500">
                                    No students found matching the criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- DASHBOARD LAYOUT COMPONENT ---
export const DashboardLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { admins, students, loading, error, fetchDashboardData } = useAdminData();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'admins' | 'students'>('dashboard');

        useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Calculate chart data using the real student data
    const branchChartData = useMemo(() => calculateBranchData(students), [students]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="min-h-screen p-8 bg-red-50 text-red-700">
                <h2 className="text-2xl font-bold">Error Loading Data</h2>
                <p>{error}</p>
                <button 
                    onClick={fetchDashboardData} 
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Try Reloading Data
                </button>
            </div>
        );
    }


    const navItems = [
        { id: 'dashboard', name: 'Dashboard', icon: BarChart2 },
        { id: 'admins', name: 'Sub-Admin Management', icon: UserCog },
        { id: 'students', name: 'Student Management', icon: Users },
    ];

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardSection admins={admins} students={students} branchData={branchChartData} />;
            case 'admins':
                return <AdminManagementSection />; // Uses context internally
            case 'students':
                return <StudentManagementSection />; // Uses context internally
            default:
                return <DashboardSection admins={admins} students={students} branchData={branchChartData} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex antialiased">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white shadow-xl flex-shrink-0 border-r border-gray-100 hidden md:block">
                <div className="p-6 h-16 flex items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Path2Gate Admin
                        </span>
                    </div>
                </div>
                <nav className="p-4 space-y-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id as 'dashboard' | 'admins' | 'students')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                    activeSection === item.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-200'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                    {/* Logout Button in Sidebar */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 text-red-600 hover:bg-red-100 mt-6"
                    >
                        <XCircle className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                {/* Mobile Header (for navigation and logout) */}
                <header className="md:hidden bg-white p-4 mb-4 rounded-xl shadow-md border-b border-gray-100 flex justify-between items-center">
                    <select
                        value={activeSection}
                        onChange={(e) => setActiveSection(e.target.value as 'dashboard' | 'admins' | 'students')}
                        className="py-2 px-3 border border-gray-300 rounded-lg text-gray-700 font-medium focus:ring-purple-500 focus:border-purple-500 mr-4"
                    >
                        {navItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={onLogout}
                        className="px-3 py-2 text-sm text-red-600 font-semibold border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Logout
                    </button>
                </header>

                {renderSection()}
            </main>
        </div>
    );
};

// --- ROOT COMPONENT: Wraps the application with the Admin Data Provider ---
const SystemAdmin: React.FC = () => {

    const systemAdminToken = localStorage.getItem("systemAdminToken");

    // If token not found → show login page
    if (!systemAdminToken) {
        return (
            <AdminLoginPage
                onLogin={(token) => {
                    localStorage.setItem("systemAdminToken", token);
                    window.location.reload();
                }}
            />
        );
    }

    // If token exists → allow dashboard
    return (
        <AdminDataProvider>
            <DashboardLayout
                onLogout={() => {
                    localStorage.removeItem("systemAdminToken");
                    window.location.reload();
                }}
            />
        </AdminDataProvider>
    );
};

export default SystemAdmin;