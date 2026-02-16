"use client"

import type React from "react"
import { useState } from "react"
import { BookOpen, Search, Filter, Edit, Trash2, Plus, Eye, X } from "lucide-react"
import { useData } from "../contexts/DataContext"
import { useAuth } from "../contexts/AuthContext"

const StudyMaterials: React.FC = () => {
  const { studyMaterials, addStudyMaterial, updateStudyMaterial, deleteStudyMaterial, loading } = useData()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingMaterial, setViewingMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
    difficulty: "Easy" as "Easy" | "Medium" | "Hard",
  })

  const subjects = [...new Set(studyMaterials.map((m) => m.subject))]

const filteredMaterials = studyMaterials.filter(
  (material) =>
    (material.title?.toLowerCase() ?? "")  // ← safe access
      .includes(searchTerm.toLowerCase()) &&
    (selectedSubject === "" || material.subject === selectedSubject),
);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (editingId) {
    await updateStudyMaterial(editingId, formData)
    setEditingId(null)
  } else {
    await addStudyMaterial(formData)  // ✅ here
  }

  setFormData({ title: "", subject: "", content: "", difficulty: "Easy" })
  setShowAddForm(false)
}



  const handleEdit = (material: any) => {
    setFormData(material)
    setEditingId(material.id)
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      deleteStudyMaterial(id)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading study materials...</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
              {user?.role === "admin" && (
                <div className="text-sm text-slate-500">Total materials: {studyMaterials.length}</div>
              )}
              {user?.role === "admin" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Add Material</span>
                </button>
              )}
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject, index) => (
  <option key={subject ?? index} value={subject ?? ""}>
    {subject ?? "Unknown"}
  </option>
))}

                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  {editingId ? "Edit Material" : "Add New Material"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })
                      }
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
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingId(null)
                        setFormData({ title: "", subject: "", content: "", difficulty: "Easy" })
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    >
                      {editingId ? "Update" : "Add"} Material
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Material Modal */}
          {viewingMaterial && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{viewingMaterial.title}</h2>
                  <button
                    onClick={() => setViewingMaterial(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="mb-4">
                  <span className="text-sm text-slate-600">Subject: </span>
                  <span className="font-medium">{viewingMaterial.subject}</span>
                  <span
                    className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(viewingMaterial.difficulty)}`}
                  >
                    {viewingMaterial.difficulty}
                  </span>
                </div>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700">{viewingMaterial.content}</div>
                </div>
              </div>
            </div>
          )}

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredMaterials.map((material, index) => (
              <div
                key={material.id || `fallback-${index}`}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{material.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{material.subject}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(material.difficulty)}`}
                    >
                      {material.difficulty}
                    </span>
                  </div>
                  <BookOpen className="w-6 h-6 text-slate-400" />
                </div>

                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
  {(material.content ?? "").slice(0, 150)}...
</p>


                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setViewingMaterial(material)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Eye size={16} />
                    <span className="text-sm">View</span>
                  </button>

                  {user?.role === "admin" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
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

          {filteredMaterials.length === 0 && !loading && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No materials found</h3>
              <p className="text-slate-600">
                {searchTerm || selectedSubject
                  ? "Try adjusting your search criteria"
                  : "No study materials available yet"}
              </p>
              <p className="text-xs text-slate-400 mt-2">Debug: {studyMaterials.length} total materials loaded</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StudyMaterials
