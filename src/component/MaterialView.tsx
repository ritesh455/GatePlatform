"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useData } from "../contexts/DataContext"
import { ArrowLeft } from "lucide-react"

const MaterialView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { studyMaterials } = useData()

  const material = studyMaterials.find((m: any) => m.id === id)

  if (!material) {
    return <div className="text-center py-10">Material not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto">

      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2" size={18} />
        Back
      </button>

      <div className="bg-white shadow rounded-xl p-6 border border-slate-200">

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          {material.title}
        </h1>

        <div className="mb-4 text-sm text-slate-600">
          Subject: <span className="font-medium">{material.subject}</span>
        </div>

        <div className="prose max-w-none whitespace-pre-wrap text-slate-700">
          {material.content}
        </div>

      </div>

    </div>
  )
}

export default MaterialView