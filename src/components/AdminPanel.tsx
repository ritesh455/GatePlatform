import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen, Target, Settings } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const AdminPanel: React.FC = () => {
  const [questionAddedMessage, setQuestionAddedMessage] = useState<string>("");
  const { 
    studyMaterials, 
    mockTests, 
    testResults,
    addStudyMaterial,
    addMockTest,
    updateStudyMaterial,
    updateMockTest,
    deleteStudyMaterial,
    deleteMockTest,
    addQuestionToMockTest
  } = useData();

  const [activeTab, setActiveTab] = useState('materials');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [selectedTestId, setSelectedTestId] = useState<string>('');

  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject: '',
    content: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
  });

  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration: 30,
    questions: [] as any[],
  });

  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    subject: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
  });

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      updateStudyMaterial(editingMaterial.id, materialForm);
      setEditingMaterial(null);
    } else {
      addStudyMaterial(materialForm);
    }
    setMaterialForm({ title: '', subject: '', content: '', difficulty: 'Easy' });
    setShowAddMaterial(false);
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTest) {
      updateMockTest(editingTest.id, testForm);
      setEditingTest(null);
    } else {
      addMockTest(testForm);
    }
    setTestForm({ title: '', description: '', duration: 30, questions: [] });
    setShowAddTest(false);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestId) {
      const test = mockTests.find(t => t.id === selectedTestId);
      addQuestionToMockTest(selectedTestId, questionForm).then(() => {
        setQuestionAddedMessage(`Question added to test: ${test?.title || "Unknown"}`);
      });
    }
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      subject: '',
      difficulty: 'Easy',
    });
    setShowAddQuestion(false);
  };

  const handleEditMaterial = (material: any) => {
    setMaterialForm(material);
    setEditingMaterial(material);
    setShowAddMaterial(true);
  };

  const handleEditTest = (test: any) => {
    setTestForm(test);
    setEditingTest(test);
    setShowAddTest(true);
  };

  const tabs = [
    { id: 'materials', label: 'Study Materials', icon: BookOpen },
    { id: 'tests', label: 'Mock Tests', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Panel</h1>
        <p className="text-slate-600">Manage content and monitor platform activity</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Study Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Study Materials</h2>
            <button
              onClick={() => setShowAddMaterial(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Material</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studyMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{material.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {material.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          material.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          material.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {material.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteStudyMaterial(material.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mock Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-900">Mock Tests</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddTest(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Test</span>
              </button>
              <button
                onClick={() => setShowAddQuestion(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mockTests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{test.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {Number(test.question_count)} questions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {test.duration} minutes
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTest(test)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteMockTest(test.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Tests Taken</p>
                  <p className="text-2xl font-bold text-slate-900">{testResults.length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Average Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {testResults.length > 0 
                      ? (testResults.reduce((sum, result) => sum + result.score, 0) / testResults.length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Study Materials</p>
                  <p className="text-2xl font-bold text-slate-900">{studyMaterials.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Recent Completed Tests */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Completed Tests</h3>
            {testResults.length > 0 ? (
              <div className="space-y-3">
                {testResults
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 10)
                  .map((result) => {
                    const test = mockTests.find(t => t.id === result.test_id);
                    const accuracy = result.total_questions > 0 ? (result.score / result.total_questions * 100).toFixed(1) : '0';
                    return (
                      <div key={result.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{test?.title || 'Unknown Test'}</p>
                          <p className="text-sm text-slate-600">
                            {new Date(result.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {result.score}/{result.total_questions}
                          </p>
                          <p className="text-sm text-blue-600 font-medium">{accuracy}%</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-4">No completed tests yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={materialForm.subject}
                  onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <select
                  value={materialForm.difficulty}
                  onChange={(e) => setMaterialForm({ ...materialForm, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                <textarea
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMaterial(false);
                    setEditingMaterial(null);
                    setMaterialForm({ title: '', subject: '', content: '', difficulty: 'Easy' });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {editingMaterial ? 'Update' : 'Add'} Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editingTest ? 'Edit Test' : 'Create New Test'}
            </h2>
            <form onSubmit={handleAddTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={testForm.duration}
                  onChange={(e) => setTestForm({ ...testForm, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTest(false);
                    setEditingTest(null);
                    setTestForm({ title: '', description: '', duration: 30, questions: [] });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {editingTest ? 'Update' : 'Create'} Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Test</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a test</option>
                  {mockTests.map(test => (
                    <option key={test.id} value={test.id}>{test.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                <select
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {questionForm.options.map((_, index) => (
                    <option key={index} value={index}>Option {index + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Explanation</label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuestion(false);
                    setQuestionForm({
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: '',
                      subject: '',
                      difficulty: 'Easy',
                    });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup message for question added */}
      {questionAddedMessage && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {questionAddedMessage}
          <button
            className="ml-4 text-white underline"
            onClick={() => setQuestionAddedMessage("")}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
