import React from 'react';
import { BookOpen, Target, Trophy, Clock, TrendingUp, Award } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

type ViewName = 'dashboard' | 'admin' | 'chapters' | 'study' | 'tests' | 'progress';

interface UserDashboardProps {
  onNavigate?: (view: ViewName) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { studyMaterials, mockTests, testResults, loading: dataLoading } = useData();
  const { user, loading: authLoading } = useAuth();

  // --- Loading & Auth Checks ---

  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-600 ml-4">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-semibold text-slate-900">Please log in to view your dashboard.</p>
      </div>
    );
  }

  // --- Data Filtering and Calculations ---
    
  // 🛑 FIX: Use user.userNo for filtering, as established in the backend/context fixes.
  const userIdentifier = user.userNo || user.id;

  const userResults = testResults.filter(result => 
        // We check against both the new (student_user_no alias) and old (user_id) field names
        (result as any).student_user_no === userIdentifier || (result as any).user_id === userIdentifier
    );
    
  const totalTests = userResults.length;

  // Calculation for average score
 const totalScoreSum = userResults.reduce((sum, result) => sum + result.score, 0); 
const totalQuestionsAnswered = userResults.reduce((sum, result) => sum + result.total_questions, 0);

const averageScore = totalQuestionsAnswered > 0
  // FIX 2: Use the corrected variable name
  ? (totalScoreSum / totalQuestionsAnswered) * 100
  : 0;

  const recentResults = userResults
    // 🛑 FIX: Use completed_at if completedAt isn't present (matching DataContext types)
    .sort((a, b) => {
        const dateA = new Date((b as any).completed_at || (b as any).completedAt).getTime();
        const dateB = new Date((a as any).completed_at || (a as any).completedAt).getTime();
        return dateA - dateB;
    })
    .slice(0, 5);

  const stats = [
    {
      icon: BookOpen,
      label: 'Study Materials',
      value: studyMaterials.length,
      color: 'bg-blue-500',
    },
    {
      icon: Target,
      label: 'Available Tests',
      value: mockTests.length,
      color: 'bg-purple-500',
    },
    {
      icon: Trophy,
      label: 'Tests Completed',
      value: totalTests,
      color: 'bg-emerald-500',
    },
    {
      icon: Award,
      label: 'Average Score',
      value: `${averageScore.toFixed(1)}%`,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user.username || user.name}!
        </h1>
        <p className="text-slate-600">
          Continue your GATE preparation journey
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
            <h2 className="text-xl font-semibold text-slate-900">Recent Test Results</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          {recentResults.length > 0 ? (
            <div className="space-y-4">
              {recentResults.map((result) => {
                const test = mockTests.find(t => t.id === result.test_id);
                const completedDate = new Date((result as any).completed_at || (result as any).completedAt).toLocaleDateString();
                const accuracy = (result.score / result.total_questions) * 100;
                
                return (
                  <div key={result.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900">{test?.title}</h3>
                      <p className="text-sm text-slate-600">
                        {completedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        {result.score}/{result.total_questions}
                      </p>
                      <p className={`text-sm font-medium ${accuracy >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {accuracy.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No test results yet</p>
              <p className="text-sm text-slate-500 mt-1">Take your first mock test to see results here</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <button 
              onClick={() => onNavigate?.('tests')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105">
              Start New Test
            </button>
            <button 
              onClick={() => onNavigate?.('study')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105">
              Browse Materials
            </button>
            <button 
              onClick={() => onNavigate?.('progress')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105">
              View Progress
            </button>
          </div>
        </div>
      </div>

      {/* Study Progress */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Study Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Study Materials</h3>
            <p className="text-slate-600">Access comprehensive study materials</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Mock Tests</h3>
            <p className="text-slate-600">Practice with realistic exam simulations</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Track Progress</h3>
            <p className="text-slate-600">Monitor your improvement over time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;