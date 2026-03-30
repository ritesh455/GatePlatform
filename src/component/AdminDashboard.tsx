import React, { useMemo } from 'react';
import { Users, BookOpen, Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';

// Define a simple User interface to avoid the 'any' type error
interface User {
  id: string;
  name: string;
}

const AdminDashboard: React.FC = () => {
  const { studyMaterials, mockTests, testResults, totalStudents } = useData();

  // --- Helper Function ---
  // This function is already correct and defensively handles missing IDs.
  const findUserName = (userId: string | number | null | undefined): string => {
    if (!userId) {
      return 'User ID Missing'; 
    }
    const idString = String(userId);
    if (idString.length === 0) {
        return 'User ID Missing';
    }
    // Truncated ID (works for both UUIDs and BIGINT user_no)
    const truncatedId = idString.substring(0, 8).toUpperCase();
    return `User ${truncatedId}`;
  };
    
  // --- Data Calculations ---
  
  // 🛑 FIX: Calculate platform-wide average score (Weighted Average)
  const { totalScoreSum, totalQuestionsSum } = useMemo(() => {
    return testResults.reduce((acc, result) => {
        // Use type assertion for dynamic fields and ensure numerical safety
        const score = result.score || 0;
        const total = result.total_questions || 0;
        return {
            totalScoreSum: acc.totalScoreSum + score,
            totalQuestionsSum: acc.totalQuestionsSum + total,
        };
    }, { totalScoreSum: 0, totalQuestionsSum: 0 });
  }, [testResults]);

  const platformAverageAccuracy = totalQuestionsSum > 0
    ? (totalScoreSum / totalQuestionsSum) * 100
    : 0;
    
  const totalTestsCompleted = testResults.length;

  const recentActivity = useMemo(() => {
    return testResults
    // FIX: Sort using dynamic completedAt/completed_at field access
    .sort((a, b) => {
            const dateA = new Date((b as any).completed_at || (b as any).completedAt).getTime();
            const dateB = new Date((a as any).completed_at || (a as any).completedAt).getTime();
            return dateA - dateB;
        })
    .slice(0, 5);
  }, [testResults]);


  const stats = [
    {
      icon: Users,
      label: 'Total Students',
      value: totalStudents > 0 ? totalStudents : 'Loading...',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      label: 'Study Materials',
      value: studyMaterials.length,
      color: 'bg-purple-500',
    },
    {
      icon: Target,
      label: 'Mock Tests',
      value: mockTests.length,
      color: 'bg-emerald-500',
    },
    {
      icon: Award,
      label: 'Avg Accuracy',
      value: `${platformAverageAccuracy.toFixed(1)}%`,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Manage your GATE preparation platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Recent Test Activity</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((result) => {
                const test = mockTests.find(t => t.id === result.test_id);

                // 🛑 FIX: Use completed_at field and cast the user identifier
                const date = new Date((result as any).completed_at || (result as any).completedAt);
                const formattedDate = isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                
                // Get the correct user ID field
                const resultUserId = (result as any).student_user_no || (result as any).user_id;

                const userName = findUserName(resultUserId);

                return (
                  <div key={result.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900">{test?.title}</h3>
                      <p className="text-sm text-slate-600">
                        {userName} • {formattedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {result.score}/{result.total_questions}
                      </p>
                      <p className="text-sm text-slate-600">
                        {((result.score / result.total_questions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No test activity yet</p>
              <p className="text-sm text-slate-500 mt-1">Activity will appear here as users take tests</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105">
              Add Study Material
            </button>
            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105">
              Create Mock Test
            </button>
            <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105">
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Content Management</h3>
            <p className="text-slate-600">Create and manage study materials</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Test Management</h3>
            <p className="text-slate-600">Design and monitor mock tests</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Analytics</h3>
            <p className="text-slate-600">Track user progress and performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;