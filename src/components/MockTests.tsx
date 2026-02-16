import React, { useState } from 'react';
import { Target, Clock, Play, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import TestTaking from './TestTaking';
import type { MockTest } from '../contexts/DataContext';
import { apiService } from '../services/api'; // ✅ added

const MockTests: React.FC = () => {
  const { mockTests, addMockTest, updateMockTest, deleteMockTest } = useData();
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    questions: [] as any[],
  });
  const [loadingTest, setLoadingTest] = useState(false); // ✅ added

  // ✅ updated to fetch questions from backend
  const handleStartTest = async (test: MockTest) => {
    setLoadingTest(true);
    const res = await apiService.getMockTest(test.id);
    if (res.success && res.data) {
      setSelectedTest(res.data); // full test with questions
    } else {
      alert('Failed to load test questions');
    }
    setLoadingTest(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<MockTest, "id" | "createdAt"> = {
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      questions: formData.questions || [],
    };

    if (editingId) {
      updateMockTest(editingId, payload);
      setEditingId(null);
    } else {
      addMockTest(payload);
    }

    setFormData({ title: '', description: '', duration: 30, questions: [] });
    setShowAddForm(false);
  };

  const handleEdit = (test: MockTest) => {
    setFormData({
      title: test.title,
      description: test.description,
      duration: test.duration,
      questions: test.questions || [],
    });
    setEditingId(test.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      deleteMockTest(id);
    }
  };

  if (selectedTest) {
    // If no questions, show a button to go back
    if (!selectedTest.questions || selectedTest.questions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-lg text-slate-700 mb-4">No questions available for this mock test.</p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() => setSelectedTest(null)}
          >
            Go Back to Mock Tests
          </button>
        </div>
      );
    }
    return (
      <TestTaking
        test={selectedTest}
        onComplete={() => setSelectedTest(null)}
        onExit={() => setSelectedTest(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-900">Mock Tests</h1>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Test</span>
            </button>
          )}
        </div>
        <p className="text-slate-600">
          Practice with realistic GATE exam simulations
        </p>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingId ? 'Edit Test' : 'Create New Test'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* form fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({ title: '', description: '', duration: 30, questions: [] });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {editingId ? 'Update' : 'Create'} Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTests.map(test => (
          <div key={test.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{test.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{test.description}</p>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{test.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target size={16} />
                    <span>{Number(test.question_count)} questions</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleStartTest(test)} // ✅ replaced with async fetch
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105"
                disabled={loadingTest}
              >
                <Play size={16} />
                <span>{loadingTest ? 'Loading...' : 'Start Test'}</span>
              </button>
              
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(test)}
                    className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {mockTests.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No mock tests available</h3>
          <p className="text-slate-600">
            {user?.role === 'admin' ? 'Create your first mock test to get started' : 'Check back later for new tests'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MockTests;
