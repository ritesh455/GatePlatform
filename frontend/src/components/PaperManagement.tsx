import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, FileText, Plus, Edit, Trash2, Upload, X, Search, Filter } from 'lucide-react';

// --- INTERFACES ---

interface PdfPaperNote {
  id: string;
  file_name: string;
  created_at: string;
  url: string;
}

interface Paper {
  id: string;
  paper_number: number;
  paper_title: string;
  branch: string;
  pdfNotes: PdfPaperNote[];
}

interface PaperFormState {
  paper_number: number;
  paper_title: string;
}

interface PdfFormState {
  title: string;
  file: File | null;
}

// --- LOCAL STORAGE DATA MOCK AND UTILITIES ---

const LOCAL_STORAGE_KEY = 'demoPapersData';

const generateId = (): string => Math.random().toString(36).substring(2, 9);

const DEFAULT_PAPERS: Paper[] = [
  { id: generateId(), paper_number: 1, paper_title: 'Operating Systems', branch: 'CSE', pdfNotes: [{ id: generateId(), file_name: 'OS Final Review.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=OS' }] },
  { id: generateId(), paper_number: 2, paper_title: 'Java Programming', branch: 'DS', pdfNotes: [{ id: generateId(), file_name: 'Java Advanced Concepts.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=JAVA' }] },
  { id: generateId(), paper_number: 3, paper_title: 'Engineering Mathematics', branch: 'EE', pdfNotes: [{ id: generateId(), file_name: 'Vector Calculus Problems.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=MATH' }] },
];

const useLocalStoragePapers = () => {
  const [papers, setPapers] = useState<Paper[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PAPERS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Paper[]) : DEFAULT_PAPERS;
    } catch (error) {
      console.error("Error reading localStorage:", error);
      return DEFAULT_PAPERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(papers));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [papers]);

  const mockUser = { 
    id: 'admin-123', 
    role: 'admin', 
    branch: 'CSE' 
  };
    
  const addPaper = (newPaperData: PaperFormState) => {
    const newPaper: Paper = {
      id: generateId(),
      paper_number: Number(newPaperData.paper_number),
      paper_title: newPaperData.paper_title,
      branch: mockUser.branch,
      pdfNotes: [],
    };
    setPapers(prev => [...prev, newPaper]);
  };

  const updatePaper = (id: string, updatedData: PaperFormState) => {
    setPapers(prev => 
      prev.map(paper => 
        paper.id === id ? { 
          ...paper, 
          ...updatedData, 
          paper_number: Number(updatedData.paper_number) 
        } : paper
      )
    );
  };

  const deletePaper = (id: string) => {
    setPapers(prev => prev.filter(paper => paper.id !== id));
  };

  const addPdfToPaper = async (paperId: string, pdfData: { file_name: string; file: File }) => {
    const newPdf: PdfPaperNote = { 
      id: generateId(), 
      file_name: pdfData.file_name, 
      created_at: new Date().toISOString(),
      url: `https://placehold.co/100x100/3498db/ffffff?text=${(pdfData.file_name).substring(0, 4)}`,
    };
    setPapers(prev => 
      prev.map(paper => 
        paper.id === paperId ? { ...paper, pdfNotes: [...paper.pdfNotes, newPdf] } : paper
      )
    );
  };

  const removePdfFromPaper = (paperId: string, pdfId: string) => {
    setPapers(prev => 
      prev.map(paper => 
        paper.id === paperId ? { 
          ...paper, 
          pdfNotes: paper.pdfNotes.filter((pdf) => pdf.id !== pdfId)
        } : paper
      )
    );
  };

  return { 
    papers, 
    addPaper, 
    updatePaper, 
    deletePaper, 
    addPdfToPaper, 
    removePdfFromPaper, 
    mockUser 
  };
};

const DeleteConfirmationModal = ({
  paper,
  onClose,
  onConfirm,
}: {
  paper: Paper | null;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  if (!paper) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
        <h2 className="text-xl font-bold text-red-700 mb-3">Confirm Deletion</h2>
        <p className="text-slate-700 mb-6">
          Are you sure you want to delete paper **{paper.paper_title}**? This action is irreversible.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Permanently
          </button>
        </div>
        <X 
          className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

const PaperManagement: React.FC = () => {
  const {
    papers,
    addPaper,
    updatePaper,
    deletePaper,
    addPdfToPaper, 
    removePdfFromPaper,
    mockUser: user
  } = useLocalStoragePapers();

  const [showAddPaper, setShowAddPaper] = useState<boolean>(false);
  const [showAddPdf, setShowAddPdf] = useState<boolean>(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paperToDelete, setPaperToDelete] = useState<Paper | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('All Subjects');

  const [paperForm, setPaperForm] = useState<PaperFormState>({ paper_number: 1, paper_title: '' });
  const [pdfForm, setPdfForm] = useState<PdfFormState>({ title: '', file: null });

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    papers.forEach((paper) => {
      if (paper.paper_title) {
        subjects.add(paper.paper_title);
      }
    });
    return ['All Subjects', ...Array.from(subjects).sort()];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers
      .filter((paper) => {
        const matchesSearch = paper.paper_title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = subjectFilter === 'All Subjects' || paper.paper_title === subjectFilter;
        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => a.paper_number - b.paper_number);
  }, [papers, searchQuery, subjectFilter]);

  const handleDeletePaperClick = (paperId: string) => {
    const found = papers.find(c => c.id === paperId);
    if (found) setPaperToDelete(found);
  };

  const confirmDelete = () => {
    if (paperToDelete) {
      deletePaper(paperToDelete.id);
      setPaperToDelete(null);
    }
  };

  const handleAddPaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaper) {
      updatePaper(editingPaper.id, paperForm);
      setEditingPaper(null);
    } else {
      addPaper({ ...paperForm });
    }
    setPaperForm({ paper_number: 1, paper_title: '' });
    setShowAddPaper(false);
  };

  const handleAddPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pdfForm.file) {
      const mockPdfData = { 
        file_name: pdfForm.title || pdfForm.file.name, 
        file: pdfForm.file
      };
      await addPdfToPaper(selectedPaperId, mockPdfData);
    } else {
      console.warn("Attempted to add PDF without a file.");
    }

    setPdfForm({ title: '', file: null });
    setShowAddPdf(false);
    setSelectedPaperId(''); // Fixed the logic here
  };

  const handleEditPaper = (paper: Paper) => {
    setPaperForm({ paper_number: paper.paper_number, paper_title: paper.paper_title });
    setEditingPaper(paper);
    setShowAddPaper(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 sm:mb-0">PDF Papers (Local Demo)</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddPaper(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
          >
            <Plus size={20} />
            <span>Add Paper</span>
          </button>
        )}
      </div>

      <p className="text-slate-600 mb-6">Upload and organize academic papers by subject. (Data stored in browser's local storage)</p>

      <div className="mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search papers by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-3 text-slate-500 hover:text-slate-800 transition-colors rounded-full sm:hidden"
            aria-label="Clear search"
          >
            <X size={20} />
          </button>
        )}
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
            <Filter size={20} />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg appearance-none bg-white shadow-inner cursor-pointer"
          >
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAddPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingPaper ? 'Edit Paper' : 'Add New Paper'}</h2>
            <form onSubmit={handleAddPaper} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Paper Number</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={paperForm.paper_number}
                  onChange={(e) => setPaperForm({ ...paperForm, paper_number: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Paper Title (e.g., Operating Systems)</label>
                <input
                  type="text"
                  required
                  value={paperForm.paper_title}
                  onChange={(e) => setPaperForm({ ...paperForm, paper_title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPaper(false);
                    setEditingPaper(null);
                    setPaperForm({ paper_number: 1, paper_title: '' });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {editingPaper ? 'Update' : 'Add'} Paper
                </button>
              </div>
              <X 
                className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
                onClick={() => {
                  setShowAddPaper(false);
                  setEditingPaper(null);
                  setPaperForm({ paper_number: 1, paper_title: '' });
                }}
              />
            </form>
          </div>
        </div>
      )}

      {showAddPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload PDF Document</h2>
            <form onSubmit={handleAddPdf} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Document Title</label>
                <input
                  type="text"
                  required
                  value={pdfForm.title}
                  onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select PDF File</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setPdfForm({ ...pdfForm, file: e.target.files ? e.target.files[0] : null })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPdf(false);
                    setPdfForm({ title: '', file: null });
                    setSelectedPaperId('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  Upload PDF
                </button>
              </div>
              <X 
                className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
                onClick={() => {
                  setShowAddPdf(false);
                  setPdfForm({ title: '', file: null });
                  setSelectedPaperId('');
                }}
              />
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal 
        paper={paperToDelete}
        onClose={() => setPaperToDelete(null)}
        onConfirm={confirmDelete}
      />

      <div className="space-y-6">
        {filteredPapers.map((paper) => {
          const pdfNotes = paper.pdfNotes ?? [];
          return (
            <div key={paper.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Paper {paper.paper_number}: {paper.paper_title}
                  </h2>
                  <p className="text-xs font-semibold text-purple-600 mt-1">
                    Branch: {paper.branch || 'ALL'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {pdfNotes.length} PDF documents
                  </p>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPaperId(paper.id);
                        setShowAddPdf(true);
                      }}
                      className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-1"
                    >
                      <Upload size={16} />
                      <span>Add PDF</span>
                    </button>
                    <button onClick={() => handleEditPaper(paper)} className="p-2 text-slate-600 hover:text-blue-600 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePaperClick(paper.id)}
                      className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    Documents
                  </h3>
                  {pdfNotes.length > 0 ? (
                    <div className="space-y-3">
                      {pdfNotes.map((pdf) => (
                        <div key={pdf.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">{pdf.file_name}</h4>
                              <p className="text-sm text-slate-600">Added {new Date(pdf.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a 
                              href={pdf.url || '#'}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                              aria-label={`Open ${pdf.file_name}`}
                            >
                              <FileText size={16} />
                            </a>
                            {user?.role === 'admin' && (
                              <button onClick={() => removePdfFromPaper(paper.id, pdf.id)} className="p-2 text-red-600 hover:text-red-700 transition-colors">
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No PDF documents available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPapers.length === 0 && ( 
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery || subjectFilter !== 'All Subjects' ? 'No papers match your filters.' : 'No papers available'}
          </h3>
          <p className="text-slate-600">
            {user?.role === 'admin' ? 'Create your first paper subject to get started' : 'Check back later for new papers'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaperManagement;