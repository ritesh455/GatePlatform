import React, { useState, useMemo } from 'react';
import { BookOpen, FileText, Video, Plus, Edit, Trash2, Upload, Play, X, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface DeleteConfirmationModalProps {
  chapter: any;
  onClose: () => void;
  onConfirm: () => void;
}
// Confirmation Modal Component to replace window.confirm
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ chapter, onClose, onConfirm }) => {
    if (!chapter) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                <h2 className="text-xl font-bold text-red-700 mb-3">Confirm Deletion</h2>
                <p className="text-slate-700 mb-6">
                    Are you sure you want to delete chapter **{chapter.chapter_title}**? This action is irreversible.
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

const ChapterManagement: React.FC = () => {
  const {
    chapters = [],
    addChapter,
    updateChapter,
    deleteChapter,
    addPdfToChapter,
    addVideoToChapter,
    removePdfFromChapter,
    removeVideoFromChapter
  } = useData();
  const { user } = useAuth();

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddPdf, setShowAddPdf] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  // State for deletion confirmation
  const [chapterToDelete, setChapterToDelete] = useState<any>(null);
  // State for the new subject filtering feature
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');


  const [chapterForm, setChapterForm] = useState({ chapter_number: 1, chapter_title: '' });
  const [pdfForm, setPdfForm] = useState<{ title: string; file: File | null }>({ title: '', file: null });
  const [videoForm, setVideoForm] = useState({ title: '', youtubeUrl: '', duration: '' });

  const [videoLoading, setVideoLoading] = useState(false);

  // Extract unique subjects for the filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    chapters.forEach(chapter => {
        if (chapter.chapter_title) {
            subjects.add(chapter.chapter_title);
        }
    });
    return ['All Subjects', ...Array.from(subjects).sort()];
  }, [chapters]);


  // Filter and sort chapters based on search query AND subject filter
  const filteredChapters = useMemo(() => {
    return chapters
      .filter(chapter => {
          // 1. Search filter
          const matchesSearch =
  (chapter.chapter_title ?? "")
    .toLowerCase()
    .includes(searchQuery.toLowerCase());

          // 2. Subject filter
          const matchesSubject = subjectFilter === 'All Subjects' || chapter.chapter_title === subjectFilter;

          return matchesSearch && matchesSubject;
      })
      .sort((a, b) => a.chapter_number - b.chapter_number);
  }, [chapters, searchQuery, subjectFilter]);


  // Handler for delete confirmation modal
  const handleDeleteChapterClick = (chapterId: string) => {
    setChapterToDelete(chapters.find(c => c.id === chapterId));
  };

  const confirmDelete = () => {
    if (chapterToDelete) {
      deleteChapter(chapterToDelete.id);
      setChapterToDelete(null);
    }
  };


  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChapter) {
      updateChapter(editingChapter.id, chapterForm);
      setEditingChapter(null);
    } else {
      // Assuming backend auto-inserts admin branch
      addChapter({ ...chapterForm, pdfNotes: [], videoTutorials: [] });
    }
    setChapterForm({ chapter_number: 1, chapter_title: '' });
    setShowAddChapter(false);
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  // const handleAddPdf = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (selectedChapterId && pdfForm.file) {
  //     // Correct the property name from 'title' to 'file_name'
  //     const pdfData = { file_name: pdfForm.title, file: pdfForm.file };
  //     await addPdfToChapter(selectedChapterId, pdfData);
  //   }
  //   setPdfForm({ title: '', file: null });
  //   setShowAddPdf(false);
  //   setSelectedChapterId('');
  // };
  const handleAddPdf = async (e: React.FormEvent) => {
  e.preventDefault();

  if (selectedChapterId && pdfForm.file) {
    try {
      setPdfLoading(true); // ✅ START LOADING

      const pdfData = { file_name: pdfForm.title, file: pdfForm.file };
      await addPdfToChapter(selectedChapterId, pdfData);

      alert("PDF added successfully ✅"); // ✅ SUCCESS MESSAGE
    } catch (error) {
      console.error(error);
      alert("Failed to upload PDF ❌");
    } finally {
      setPdfLoading(false); // ✅ STOP LOADING
    }
  }

  setPdfForm({ title: '', file: null });
  setShowAddPdf(false);
  setSelectedChapterId('');
};

const handleAddVideo = async (e: React.FormEvent) => {
  e.preventDefault();

  if (selectedChapterId) {
    try {
      setVideoLoading(true); // ✅ START LOADING

      await addVideoToChapter(selectedChapterId, videoForm);

      alert("Video added successfully ✅"); // ✅ SUCCESS
    } catch (error) {
      console.error(error);
      alert("Failed to add video ❌");
    } finally {
      setVideoLoading(false); // ✅ STOP LOADING
    }
  }

  setVideoForm({ title: '', youtubeUrl: '', duration: '' });
  setShowAddVideo(false);
  setSelectedChapterId('');
};

  const handleEditChapter = (chapter: any) => {
    setChapterForm({ chapter_number: chapter.chapter_number, chapter_title: chapter.chapter_title });
    setEditingChapter(chapter);
    setShowAddChapter(true);
  };

  const extractYouTubeId = (url?: string | null) => {
    if (!url) return null;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterId: string) => {
  setOpenChapters((prev) => ({
    ...prev,
    [chapterId]: !prev[chapterId],
  }));
};


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 sm:mb-0">Subjects</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddChapter(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
          >
            <Plus size={20} />
            <span>Add Chapter</span>
          </button>
        )}
        
      </div>

      <p className="text-slate-600 mb-6">Organize study materials and video tutorials subject wise</p>

    {/* Search and Filter Bar */}
    <div className="mb-8 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow w-full sm:w-auto">
            <input
                type="text"
                placeholder="Search chapters by title..."
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


      {/* Add Chapter Modal */}
      {showAddChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</h2>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Number</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={chapterForm.chapter_number}
                  onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Title</label>
                <input
                  type="text"
                  required
                  value={chapterForm.chapter_title}
                  onChange={(e) => setChapterForm({ ...chapterForm, chapter_title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChapter(false);
                    setEditingChapter(null);
                    setChapterForm({ chapter_number: 1, chapter_title: '' });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                >
                  {editingChapter ? 'Update' : 'Add'} Chapter
                </button>
              </div>
              <X 
                  className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
                  onClick={() => {
                      setShowAddChapter(false);
                      setEditingChapter(null);
                      setChapterForm({ chapter_number: 1, chapter_title: '' });
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add PDF Notes</h2>
            <form onSubmit={handleAddPdf} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PDF Title</label>
                <input
                  type="text"
                  required
                  value={pdfForm.title}
                  onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload PDF File</label>
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
                    setSelectedChapterId('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
  type="submit"
  disabled={pdfLoading}
  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center"
>
  {pdfLoading ? (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  ) : (
    "Add PDF"
  )}
</button>
              </div>
               <X 
                  className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
                  onClick={() => {
                      setShowAddPdf(false);
                      setPdfForm({ title: '', file: null });
                      setSelectedChapterId('');
                  }}
              />
            </form>
            
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Video Tutorial</h2>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Video Title</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">YouTube URL</label>
                <input
                  type="url"
                  required
                  value={videoForm.youtubeUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, youtubeUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (optional)</label>
                <input
                  type="text"
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 45:30"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVideo(false);
                    setVideoForm({ title: '', youtubeUrl: '', duration: '' });
                    setSelectedChapterId('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              <button
  type="submit"
  disabled={videoLoading}
  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center"
>
  {videoLoading ? (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  ) : (
    "Add Video"
  )}
</button>
              </div>
              <X 
                  className="absolute top-3 right-3 w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-700"
                  onClick={() => {
                      setShowAddVideo(false);
                      setVideoForm({ title: '', youtubeUrl: '', duration: '' });
                      setSelectedChapterId('');
                  }}
              />
            </form>
          </div>
        </div>
      )}

      {/* Render Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        chapter={chapterToDelete}
        onClose={() => setChapterToDelete(null)}
        onConfirm={confirmDelete}
      />


      {/* Chapters Grid */}
      <div className="space-y-6">
        {filteredChapters // Use filtered chapters here
          .map((chapter) => {
            const pdfNotes = chapter.pdfNotes ?? [];
            const videoTutorials = chapter.videoTutorials ?? [];

            return (
              <div key={chapter.id ?? `chapter-${chapter.chapter_number}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Chapter Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer"
     onClick={() => toggleChapter(chapter.id)}>
                  <div>
                    <div className="flex items-center space-x-2">
  {openChapters[chapter.id] ? (
    <ChevronDown className="w-5 h-5 text-slate-600" />
  ) : (
    <ChevronRight className="w-5 h-5 text-slate-600" />
  )}

  <h2 className="text-xl font-bold text-slate-900">
    Subject : {chapter.chapter_title}
  </h2>
</div>
                    <p className="text-xs font-semibold text-purple-600 mt-1">
                        Branch: {chapter.branch || 'ALL'}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {pdfNotes.length} PDF notes • {videoTutorials.length} video tutorials
                    </p>
                  </div>

                  {user?.role === 'admin' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedChapterId(chapter.id);
                          setShowAddPdf(true);
                        }}
                        className="bg-emerald-500 text-white px-3 py-2 rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-1"
                      >
                        <Upload size={16} />
                        <span>Add PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedChapterId(chapter.id);
                          setShowAddVideo(true);
                        }}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1"
                      >
                        <Video size={16} />
                        <span>Add Video</span>
                      </button>

                      <button onClick={() => handleEditChapter(chapter)} className="p-2 text-slate-600 hover:text-blue-600 transition-colors">
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteChapterClick(chapter.id)}
                        className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                    </div>
                  )}
                </div>

                {/* Chapter Content */}
                {openChapters[chapter.id] && (
  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PDF Notes Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-500" />
                      PDF Notes
                    </h3>
                    {pdfNotes.length > 0 ? (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                        {pdfNotes.map((pdf) => (
                          <div key={pdf.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900">{pdf.file_name}</h4>
                                <p className="text-sm text-slate-600">Added {pdf.created_at ? new Date(pdf.created_at).toLocaleDateString() : "Recently"}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* **FIX:** Change the `<a>` tag to open the PDF in a new tab */}
                              {/* http://localhost:5000/public/7dbb3fc3dd1023dd5e626ae894095fe2.pdf */}
                              {/* <button
                                onClick={async () => {
                                  try {
                                    // Use the API helper that fetches the PDF with auth and opens in a new tab
                                    // await apiService.openPdfInNewTab(chapter.id, pdf.id);
                                    if (pdf.url) {
                                            const fixedUrl = pdf.url.replace("/image/upload/", "/raw/upload/");
                                            window.open(fixedUrl, "_blank");
                                        }
                                  } catch (err) {
                                    console.error('Failed to open PDF:', err);
                                    // Fallback: open the raw URL if available
                                    if (pdf.url) window.open(pdf.url, '_blank');
                                  }
                                }}
                                className="p-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                aria-label={`Open ${pdf.file_name}`}
                              >
                                <FileText size={16} />
                              </button> */}

                              <button
  onClick={() => {
    console.log(pdf.url);
    if (pdf.url) {
  let fixedUrl = pdf.url;

  // Fix https issue
  if (fixedUrl.startsWith("https//")) {
    fixedUrl = fixedUrl.replace("https//", "https://");
  } 

  window.open(fixedUrl, "_blank");
}
  }}
  className="p-2 text-blue-600 hover:text-blue-700"
>
  <FileText size={16} />
</button>

                              {user?.role === 'admin' && (
                                <button onClick={() => { removePdfFromChapter(chapter.id, pdf.id); alert("PDF removed successfully ❌"); }} className="p-2 text-red-600 hover:text-red-700 transition-colors">
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
                        <p>No PDF notes available</p>
                      </div>
                    )}
                  </div>

                  {/* Video Tutorials Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Video className="w-5 h-5 mr-2 text-red-500" />
                      Video Tutorials
                    </h3>
                    {videoTutorials.length > 0 ? (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                        {videoTutorials.map((video) => (
                          <div key={video.id} className="bg-slate-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{video.title}</h4>
                                <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                  {video.duration && (
                                    <span className="flex items-center">
                                      <Play className="w-3 h-3 mr-1" />
                                      {video.duration}
                                    </span>
                                  )}
                                  <span>Added {video.addedAt ? new Date(video.addedAt).toLocaleDateString() : "Recently"}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-red-600 hover:text-red-700 transition-colors">
                                  <Play size={16} />
                                </a>

                                {user?.role === 'admin' && (
                                  <button onClick={() => { removeVideoFromChapter(chapter.id, video.id); alert("Video removed successfully ❌"); }} className="p-2 text-red-600 hover:text-red-700 transition-colors">
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {getYouTubeThumbnail(video.youtubeUrl) && (
                              <div className="relative">
                                <img src={getYouTubeThumbnail(video.youtubeUrl)!} alt={video.title} className="w-full h-32 object-cover rounded-lg" />
                                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No video tutorials available</p>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            );
          })}
      </div>

      {filteredChapters.length === 0 && ( // Check filteredChapters length
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No chapters match your search.' : 'No chapters available'}
            </h3>
          <p className="text-slate-600">
            {user?.role === 'admin' ? 'Create your first chapter to get started' : 'Check back later for new chapters'}
          </p>
        </div>
      )}
      
    </div>
  );
};

export default ChapterManagement;