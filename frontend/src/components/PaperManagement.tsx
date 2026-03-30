import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, FileText, Plus, Edit, Trash2, Upload, X, Search, Filter } from 'lucide-react';

// --- LOCAL STORAGE DATA MOCK AND UTILITIES ---

// Key for localStorage
const LOCAL_STORAGE_KEY = 'demoPapersData';

// Utility to generate a simple unique ID (UUID substitute)
const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial/default data structure
const DEFAULT_PAPERS = [
  { id: generateId(), paper_number: 1, paper_title: 'Operating Systems', branch: 'CSE', pdfNotes: [{ id: generateId(), file_name: 'OS Final Review.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=OS' }] },
  { id: generateId(), paper_number: 2, paper_title: 'Java Programming', branch: 'DS', pdfNotes: [{ id: generateId(), file_name: 'Java Advanced Concepts.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=JAVA' }] },
  { id: generateId(), paper_number: 3, paper_title: 'Engineering Mathematics', branch: 'EE', pdfNotes: [{ id: generateId(), file_name: 'Vector Calculus Problems.pdf', created_at: new Date().toISOString(), url: 'https://placehold.co/100x100/3498db/ffffff?text=MATH' }] },
];

// Hook to manage state synchronized with localStorage
const useLocalStoragePapers = () => {
    // 1. Initialize state from localStorage or use default
    const [papers, setPapers] = useState<any[]>(() => {
    if (typeof window === "undefined") return DEFAULT_PAPERS;

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_PAPERS;
    } catch (error) {
        console.error("Error reading localStorage:", error);
        return DEFAULT_PAPERS;
    }
});

    // 2. useEffect to write state changes to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(papers));
        } catch (error) {
            console.error("Error writing to localStorage:", error);
        }
    }, [papers]);

    // Mock User Context (Admin for testing, CSE for filtering demo)
    const mockUser = { 
        id: 'admin-123', 
        role: 'admin', 
        branch: 'CSE' // Simulated admin branch for testing creation/filtering
    };
    
    // --- CRUD Mock Functions ---

    const addPaper = (newPaperData:any) => {
        const newPaper = {
            id: generateId(),
            paper_number: parseInt(newPaperData.paper_number),
            paper_title: newPaperData.paper_title,
            branch: mockUser.branch, // Auto-inserted from "admin" user
            pdfNotes: newPaperData.pdfNotes || [],
        };
        setPapers(prev => [...prev, newPaper]);
    };

    const updatePaper = (id:string, updatedData:any) => {
        setPapers(prev => 
            prev.map(paper => 
                paper.id === id ? { 
                    ...paper, 
                    ...updatedData, 
                    paper_number: parseInt(updatedData.paper_number) 
                } : paper
            )
        );
    };

    const deletePaper = (id:string) => {
        setPapers(prev => prev.filter(paper => paper.id !== id));
    };

    const addPdfToPaper = async (paperId:string, pdfData:any) => {
        const newPdf = { 
            id: generateId(), 
            file_name: pdfData.file_name || pdfData.file.name, 
            created_at: new Date().toISOString(),
            // Mock URL since localStorage can't hold files
            url: `https://placehold.co/100x100/3498db/ffffff?text=${(pdfData.file_name || 'PDF').substring(0, 4)}`,
        };
        setPapers(prev => 
            prev.map(paper => 
                paper.id === paperId ? { ...paper, pdfNotes: [...paper.pdfNotes, newPdf] } : paper
            )
        );
    };

    const removePdfFromPaper = (paperId:string, pdfId:string) => {
        setPapers(prev => 
            prev.map(paper => 
                paper.id === paperId ? { 
                    ...paper, 
                    pdfNotes: paper.pdfNotes.filter((pdf:any) => pdf.id !== pdfId)
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


// --- UI Components ---

// Confirmation Modal Component for deletion
const DeleteConfirmationModal = ({
  paper,
  onClose,
  onConfirm,
}: {
  paper: any;
  onClose: () => void;
  onConfirm: () => void;
}) => {

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                <h2 className="text-xl font-bold text-red-700 mb-3">Confirm Deletion</h2>
                <p className="text-slate-700 mb-6">
                    Are you sure you want to delete paper **{paper.paper_title}**? This action is irreversible.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
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
    // Replace useData and useAuth with local storage hook
  const {
    papers,
    addPaper,
    updatePaper,
    deletePaper,
    addPdfToPaper, 
    removePdfFromPaper,
    mockUser: user
  } = useLocalStoragePapers();


  const [showAddPaper, setShowAddPaper] = useState(false);
  const [showAddPdf, setShowAddPdf] = useState(false);
  const [editingPaper, setEditingPaper] = useState<any>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  
  // State for filtering/search
  const [searchQuery, setSearchQuery] = useState('');
  const [paperToDelete, setPaperToDelete] = useState<any>(null);
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');


  const [paperForm, setPaperForm] = useState({ paper_number: 1, paper_title: '' });
  const [pdfForm, setPdfForm] = useState<{ title: string; file: File | null }>({ title: '', file: null });

  // Extract unique subjects/titles for the filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    papers.forEach((paper:any) => {
        if (paper.paper_title) {
            subjects.add(paper.paper_title);
        }
    });
    return ['All Subjects', ...Array.from(subjects).sort()];
  }, [papers]);


  // Filter and sort papers based on search query AND subject filter
  const filteredPapers = useMemo(() => {
    return papers
      .filter((paper:any) => {
          // 1. Search filter
          const matchesSearch = paper.paper_title.toLowerCase().includes(searchQuery.toLowerCase());

          // 2. Subject filter (filtering by the title, which acts as the subject/category)
          const matchesSubject = subjectFilter === 'All Subjects' || paper.paper_title === subjectFilter;

          return matchesSearch && matchesSubject;
      })
      .sort((a, b) => a.paper_number - b.paper_number);
  }, [papers, searchQuery, subjectFilter]);


  // Handler for delete confirmation modal
  const handleDeletePaperClick = (paperId: string) => {
    setPaperToDelete(papers.find(c => c.id === paperId));
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
      // Use local addPaper function
      addPaper({ ...paperForm, pdfNotes: [] });
    }
    setPaperForm({ paper_number: 1, paper_title: '' });
    setShowAddPaper(false);
  };

  const handleAddPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pdfForm.file) {
        // Since we are mocking file upload, we create a mock file data object 
        // to pass to the local mock store function.
        const mockPdfData = { 
            file_name: pdfForm.title || pdfForm.file.name, 
            file: pdfForm.file // Pass the File object for filename extraction if title is empty
        };
        // NOTE: The `apiService.openPdfInNewTab` call is removed since we are using localStorage mock
        await addPdfToPaper(selectedPaperId, mockPdfData);
    } else {
        // Optional: show error message if file is missing (required is set in UI)
        console.warn("Attempted to add PDF without a file.");
    }

    setPdfForm({ title: '', file: null });
    setShowAddPdf(false);
    setSelectedPaperId('');
  };

  const handleEditPaper = (paper: any) => {
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

    {/* Search and Filter Bar */}
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
        
        {/* Subject Filter Dropdown */}
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


      {/* Add Paper Modal */}
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

      {/* Add PDF Modal */}
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

      {/* Render Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        paper={paperToDelete}
        onClose={() => setPaperToDelete(null)}
        onConfirm={confirmDelete}
      />


      {/* Papers Grid */}
      <div className="space-y-6">
        {filteredPapers 
          .map((paper:any) => {
            const pdfNotes = paper.pdfNotes ?? [];

            return (
              <div key={paper.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Paper Header */}
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

                {/* Paper Content */}
                <div className="p-6 grid grid-cols-1 gap-6">
                  {/* PDF Notes Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-500" />
                      Documents
                    </h3>
                    {pdfNotes.length > 0 ? (
                      <div className="space-y-3">
                        {pdfNotes.map((pdf:any) => (
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