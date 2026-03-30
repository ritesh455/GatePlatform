"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiService } from "../services/api"
import { useAuth, User } from "./AuthContext" 


interface StudyMaterial {
  id: string
  title: string
  subject: string
  content: string
  difficulty: "Easy" | "Medium" | "Hard"
  createdAt: string
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  subject: string
  difficulty: "Easy" | "Medium" | "Hard"
}

export interface MockTest {
  id: string
  title: string
  description: string
  duration: number
  questions: Question[]
  question_count?: number
  createdAt: string
}

// 🛑 UPDATED TestResult Interface for backend consistency
export interface TestResult {
  id: string
  test_id: string
  student_user_no: number | string // Reflects the BIGINT ID type in DB
  score: number
  total_questions: number
  timeTaken: number // Backend column name
  answers: any // JSONB array of selected answers
  completed_at: string // Backend column name
}

export interface PdfNote {
  id: string
  file_name: string
  url: string
  created_at: string
}

interface VideoTutorial {
  id: string
  title: string
  youtubeUrl: string
  duration?: string
  addedAt: string
}

interface ChapterContent {
  id: string
  chapter_number: number
  chapter_title: string
  branch?: string | null // Branch filter for students (e.g., 'CSE', 'DS', 'Civil', etc.)
  pdfNotes: PdfNote[]
  videoTutorials: VideoTutorial[]
  createdAt: string
}

interface DataContextType {
  studyMaterials: StudyMaterial[]
  mockTests: MockTest[]
  testResults: TestResult[]
  chapters: ChapterContent[]
  loading: boolean
  error: string | null
  totalUsers: number
  totalStudents: number
  totalAdmins: number
  clearError: () => void
  addStudyMaterial: (material: Omit<StudyMaterial, "id" | "createdAt">) => Promise<void>
  addMockTest: (test: Omit<MockTest, "id" | "createdAt">) => Promise<void>
  // 🛑 UPDATED: Use backend-friendly property names in Omit
  addTestResult: (result: {
    testId: string;
    score: number;
    total_questions: number;
    timeTaken: number;
    answers: any[];
  }) => Promise<void> 
  addChapter: (chapter: Omit<ChapterContent, "id" | "createdAt">) => Promise<void>
  updateChapter: (id: string, chapter: Partial<ChapterContent>) => Promise<void>
  deleteChapter: (id: string) => Promise<void>
  addPdfToChapter: (chapterId: string, pdf: { file_name: string; file: File }) => Promise<void>
  addVideoToChapter: (
    chapterId: string,
    video: Omit<VideoTutorial, "id" | "addedAt">,
  ) => Promise<void>
  removePdfFromChapter: (chapterId: string, pdfId: string) => Promise<void>
  removeVideoFromChapter: (chapterId: string, videoId: string) => Promise<void>
  updateStudyMaterial: (id: string, material: Partial<StudyMaterial>) => Promise<void>
  updateMockTest: (id: string, test: Partial<MockTest>) => Promise<void>
  deleteStudyMaterial: (id: string) => Promise<void>
  deleteMockTest: (id: string) => Promise<void>
  addQuestionToMockTest: (testId: string, question: Omit<Question, "id">) => Promise<void>
}

// ✅ Use the chosen name
const AppDataContext = createContext<DataContextType | undefined>(undefined)

// ✅ Use the chosen name
export const useData = () => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

// ⚠️ Ensure the provider name matches the requested DataProvider
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([])
  const [mockTests, setMockTests] = useState<MockTest[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [chapters, setChapters] = useState<ChapterContent[]>([])
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [totalAdmins, setTotalAdmins] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, loading: authLoading } = useAuth()

  const clearError = () => setError(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) { 
        console.log("[v0] User not authenticated, skipping data load");
        setLoading(false);
        return;
      }

      try {
        console.log("[v0] Starting data load for authenticated user...");
        console.log(
          "[v0] API Base URL:",
          process.env.REACT_APP_API_URL || "https://gateplatform.onrender.com/api"
        );

        const [materialsRes, testsRes, resultsRes, chaptersRes] = await Promise.all([
          apiService.getStudyMaterials(),
          apiService.getMockTests(),
          apiService.getTestResults(),
          apiService.getChapters(),
        ]);

        if (materialsRes.success && materialsRes.data) {
          setStudyMaterials(materialsRes.data);
          setError(null);
        } else {
          const errMsg = "Failed to load study materials";
          console.error("[v0]", errMsg, materialsRes.message);
          // Only set error if no materials were loaded
          if (!studyMaterials.length) setError(errMsg);
        }

        if (testsRes.success && testsRes.data) {
          let testsArray: any[] = [];
          if (Array.isArray(testsRes.data)) {
            testsArray = testsRes.data;
          } else if (Array.isArray((testsRes.data as any)?.tests)) {
            testsArray = (testsRes.data as any).tests;
          }
          setMockTests(
            testsArray.map((t: any) => ({
              ...t,
              question_count: Number(t.question_count),
              questions: t.questions || [],
            }))
          );
          setError(null);
        } else {
          const errMsg = "Failed to load mock tests";
          console.error("[v0]", errMsg, testsRes.message);
          if (!mockTests.length) setError(errMsg);
        }

        if (resultsRes.success && resultsRes.data) {
          // 🛑 FIX: Ensure array data from API is correctly typed as TestResult[]
          const formattedResults: TestResult[] = resultsRes.data.results || resultsRes.data; 
          setTestResults(formattedResults);
          setError(null);
        } else {
          const errMsg = "Failed to load test results";
          console.error("[v0]", errMsg, resultsRes.message);
          if (!testResults.length) setError(errMsg);
        }

        if (chaptersRes.success && chaptersRes.data) {
          const chaptersWithUrls = chaptersRes.data.map((chapter: any) => {
            const pdfNotes = (chapter.pdf_note || []).map((pdf: any) => ({
              ...pdf,
              url: pdf.url,
            }));

            return {
              ...chapter,
              pdfNotes: pdfNotes,
              videoTutorials: chapter.video_tutorials || [],
            };
          });
          setChapters(chaptersWithUrls || []);
          setError(null);
        } else {
          const errMsg = "Failed to load chapters";
          console.error("[v0]", errMsg, chaptersRes.message);
          if (!chapters.length) setError(errMsg);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error loading data";
        console.error("[v0] Error loading data:", error);
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // --- Fetch User Count for Admin Dashboard ---
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await apiService.getUsersCount();
        if (response.success && response.data) {
          setTotalUsers(response.data.totalUsers || 0);
          setTotalStudents(response.data.totalStudents || 0);
          setTotalAdmins(response.data.totalAdmins || 0);
        }
      } catch (error) {
        console.error("Error fetching user count:", error);
      }
    };

    if (!user) return;
    fetchUserCount();
  }, [user]);

  // --- CRUD Functions ---

  // 🛑 FIX: Updated signature to match what the component should send
  const addTestResult = async (resultData: {
    testId: string;
    score: number;
    total_questions: number;
    timeTaken: number;
    answers: any[];
  }) => {
    try {
      // 🛑 FIX: Map camelCase front-end props to backend snake_case if necessary
     const payload = {
            testId: resultData.testId,
            score: resultData.score,
            total_questions: resultData.total_questions,
            timeTaken: resultData.timeTaken,
            answers: resultData.answers,
        };
// console.log("Submitting Payload:", payload);
// 🛑 DEBUG LINE ADDED HERE 🛑
        console.log("--- SUBMISSION PAYLOAD ---");
        console.log(JSON.stringify(payload, null, 2));
        console.log("--- END PAYLOAD ---");
        // 🛑 END DEBUG 🛑

        const response = await apiService.submitTestResult(payload)
        
        const newResult = response.data?.result || response.data;

    if (response.success && newResult?.id) {
            setTestResults((prev) => [...prev, newResult])
        } else {
        console.error("Failed to submit test result:", response.message);
        setError(response.message || "Failed to submit test result.");
      }
    } catch (err) {
      console.error("Network error submitting result:", err);
      setError("Network error submitting result.");
    }
  }
  
  // All other CRUD functions remain below...
  
  const addQuestionToMockTest = async (testId: string, question: Omit<Question, "id">) => {
    try {
      const response = await apiService.addQuestionToMockTest(testId, question);
      const newQuestion = response.data?.question || response.data;
      if (response.success && newQuestion?.id) {
        setMockTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                ...t,
                questions: [...(t.questions || []), newQuestion],
                question_count:
                  (typeof t.question_count === "number"
                    ? t.question_count
                    : Number(t.question_count)) + 1,
              }
              : t
          )
        );
      } else {
        console.error("API did not return a valid question:", response);
      }
    } catch (err) {
      console.error("Failed to add question to mock test:", err);
    }
  };

  const addStudyMaterial = async (material: Omit<StudyMaterial, "id" | "createdAt">) => {
    try {
      const response = await apiService.createStudyMaterial(material);
      const newMaterial = response.data?.material || response.data;
      if (response.success && newMaterial?.id) {
        setStudyMaterials((prev) => [...prev, newMaterial]);
      } else {
        console.error("API did not return a valid study material:", response);
      }
    } catch (err) {
      console.error("Failed to add study material:", err);
    }
  };

  const addMockTest = async (test: Omit<MockTest, "id" | "createdAt">) => {
    const response = await apiService.createMockTest(test);
    const newTest = response.data?.test || response.data;
    if (response.success && newTest?.id) {
      setMockTests((prev) => [...prev, newTest]);
    }
  };

  const updateMockTest = async (id: string, test: Partial<MockTest>) => {
    try {
      const response = await apiService.updateMockTest(id, {
        ...test,
        questions: test.questions || [],
      });
      const updatedTest = response.data?.test || response.data;
      if (response.success && updatedTest?.id) {
        setMockTests((prev) =>
          prev.map((t) => (t.id === id ? updatedTest : t))
        );
      } else {
        console.error("API did not return updated test:", response);
      }
    } catch (err) {
      console.error("Failed to update mock test:", err);
    }
  };

  const updateStudyMaterial = async (id: string, material: Partial<StudyMaterial>) => {
    try {
      const response = await apiService.updateStudyMaterial(id, material);
      const updatedMaterial = response.data?.material || response.data;
      if (response.success && updatedMaterial?.id) {
        setStudyMaterials((prev) =>
          prev.map((m) => (m.id === id ? updatedMaterial : m))
        );
      } else {
        console.error("API did not return updated material:", response);
      }
    } catch (err) {
      console.error("Failed to update study material:", err);
    }
  };

  const deleteStudyMaterial = async (id: string) => {
    const response = await apiService.deleteStudyMaterial(id)
    if (response.success) {
      setStudyMaterials((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const deleteMockTest = async (id: string) => {
    const response = await apiService.deleteMockTest(id)
    if (response.success) {
      setMockTests((prev) => prev.filter((t) => t.id !== id))
    }
  }

  const addChapter = async (chapter: Omit<ChapterContent, "id" | "createdAt">) => {
    const response = await apiService.createChapter(chapter)
    if (response.success && response.data) {
      setChapters((prev) => [...prev, response.data].sort((a, b) => a.chapter_number - b.chapter_number))
    }
  }

  const updateChapter = async (id: string, chapter: Partial<ChapterContent>) => {
    const response = await apiService.updateChapter(id, chapter)
    if (response.success && response.data) {
      setChapters((prev) => prev.map((c) => (c.id === id ? response.data : c)))
    }
  }

  const deleteChapter = async (id: string) => {
    const response = await apiService.deleteChapter(id)
    if (response.success) {
      setChapters((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const addPdfToChapter = async (
    chapterId: string,
    pdf: { file_name: string; file: File }
  ) => {
    try {
      const response = await apiService.addPdfToChapter(chapterId, pdf);

      if (response.success && response.data) {
        const newPdfNote = {
          ...response.data,
          url: response.data.url.startsWith("http")
    ? response.data.url
    : `${process.env.REACT_APP_API_URL_WITHOUT_API || "https://gateplatform.onrender.com"}${response.data.url}`,
};

        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? {
                ...c,
                pdfNotes: [...(c.pdfNotes || []), newPdfNote],
              }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to add PDF to chapter:", error);
    }
  };

  const addVideoToChapter = async (
    chapterId: string,
    video: Omit<VideoTutorial, "id" | "addedAt">,
  ) => {
    try {
      const response = await apiService.addVideoToChapter(chapterId, video);
      if (response.success && response.data) {
        const newVideo = {
          ...response.data,
          youtubeUrl: response.data.youtube_url,
          addedAt: response.data.added_at,
        };

        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? {
                ...c,
                videoTutorials: [...(c.videoTutorials || []), newVideo],
              }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to add video to chapter:", error);
    }
  };


  const removePdfFromChapter = async (chapterId: string, pdfId: string) => {
    try {
      const response = await apiService.deletePdfFromChapter(chapterId, pdfId)
      if (response.success) {
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? { ...c, pdfNotes: (c.pdfNotes || []).filter((pdf) => pdf.id !== pdfId) }
              : c
          )
        )
      }
    } catch (error) {
      console.error("Failed to remove PDF from chapter:", error)
    }
  }

  const removeVideoFromChapter = async (chapterId: string, videoId: string) => {
    try {
      const response = await apiService.deleteVideoFromChapter(chapterId, videoId)
      if (response.success) {
        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? { ...c, videoTutorials: (c.videoTutorials || []).filter((v) => v.id !== videoId) }
              : c
          )
        )
      }
    } catch (error) {
      console.error("Failed to remove video from chapter:", error)
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        studyMaterials,
        mockTests,
        testResults,
        chapters,
        loading,
        error,
        totalUsers,
        totalStudents,
        totalAdmins,
        clearError,
        addStudyMaterial,
        addMockTest,
        addTestResult,
        addChapter,
        updateChapter,
        deleteChapter,
        addPdfToChapter,
        addVideoToChapter,
        removePdfFromChapter,
        removeVideoFromChapter,
        updateStudyMaterial,
        updateMockTest,
        deleteStudyMaterial,
        deleteMockTest,
        addQuestionToMockTest,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}