"use client";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// --- CORE INTERFACES ---

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreateMockTestResponse {
  message: string;
  test: any; // ideally, type it as MockTest
}

// 🛑 NEW INTERFACE for Test Result Submission Payload
interface TestResultPayload {
    testId: string;
    score: number;
    total_questions: number;
    timeTaken: number;
    answers: any[];
}

// 🛑 NEW INTERFACE for Paginated Test Results Response
interface PaginatedTestResults {
    results: any[];
    pagination: any;
}


// --- ADMIN INTERFACES (New) ---

interface AdminDashboardDataResponse {
  admins: any[]; // Array of admin user objects
  students: any[]; // Array of student user objects
}

interface AdminUpdateResponse {
  admin: any; // The updated admin user object
  message: string;
}


class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("userToken"); // ✅ Fixed: use userToken instead of gate_token
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;

      let headers: HeadersInit = { ...this.getAuthHeaders(), ...options.headers };

      if (!(options.body instanceof FormData)) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      const response = await fetch(url, {
        ...options,
        headers: headers,
      });
      const data = await response.json();

      if (!response.ok) {
        // The error details from the backend (like validation errors) are often in 'data'
        const errorData = data.details || data;
        return {
          success: false,
          message: data.message || "An error occurred",
          data: errorData as T, // Return error details if needed
        };
      }

      // FIX: Since getTestResults returns { results: [], pagination: {} }, 
      // we must ensure the main data key extraction handles this.
      const responseData =
        data.materials ||
        data.tests ||
        data.chapters ||
        data.results || // This handles the array of results inside the pagination object
        data.data ||
        data;

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error("Network error:", error);
      return {
        success: false,
        message: "Network error occurred",
      };
    }
  }

  // --- Authentication ---
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getProfile() {
    return this.request<any>("/auth/profile");
  }

  // ------------------------------------
  // --- ADMIN MANAGEMENT (New Section) ---
  // ------------------------------------

  /**
   * Fetches all sub-admins and students for the admin dashboard.
   * Corresponds to GET /api/admin/dashboard-data.
   */
  async getAdminDashboardData() {
    return this.request<AdminDashboardDataResponse>("/admin/dashboard-data");
  }

  /**
   * Updates the status of a sub-admin.
   * Corresponds to PUT /api/admin/update-admin-status/:id.
   * @param id The ID (integer) of the admin.
   * @param newStatus The new status (e.g., 'accepted', 'blocked').
   */
  async updateAdminStatus(id: number | string, newStatus: string) {
    return this.request<AdminUpdateResponse>(`/admin/update-admin-status/${id}`, {
      method: "PUT",
      body: JSON.stringify({ newStatus }),
    });
  }

  /**
   * Deletes a student record.
   * Corresponds to DELETE /api/admin/students/:id.
   * @param id The ID (integer) of the student to delete.
   */
  async deleteStudent(id: number | string) {
    // The backend returns a simple message on success.
    return this.request<any>(`/admin/students/${id}`, {
      method: "DELETE",
    });
  }
  
  // --- Study Materials ---
  async getStudyMaterials() {
    return this.request<any[]>("/study-materials?limit=1000");
  }

  async createStudyMaterial(material: any) {
    return this.request<any>("/study-materials", {
      method: "POST",
      body: JSON.stringify(material),
    });
  }

  async updateStudyMaterial(id: string, material: any) {
    return this.request<any>(`/study-materials/${id}`, {
      method: "PUT",
      body: JSON.stringify(material),
    });
  }

  async deleteStudyMaterial(id: string) {
    return this.request<any>(`/study-materials/${id}`, {
      method: "DELETE",
    });
  }

  // --- Mock Tests ---
  async getMockTests() {
    const res = await this.request<any[]>("/mock-tests?limit=1000");
    if (res.success && res.data) {
      res.data = res.data.map((t: any) => ({
        ...t,
        questions: t.questions || [],
      }));
    }
    return res;
  }

  async getMockTest(id: string) {
    const res = await this.request<any>(`/mock-tests/${id}`);
    if (res.success && res.data) {
      const test = res.data;
      test.questions = test.questions || [];
      return { success: true, data: test };
    }
    return { success: false, message: res.message || "Failed to fetch test" };
  }

  async createMockTest(
    test: { title: string; description?: string; duration: number; questions?: any[] }
  ): Promise<ApiResponse<CreateMockTestResponse>> {
    const payload = {
      ...test,
      questions: test.questions || [],
    };
    const res = await this.request<CreateMockTestResponse>("/mock-tests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }

  async updateMockTest(
    id: string,
    test: { title?: string; description?: string; duration?: number; questions?: any[] }
  ) {
    const res = await this.request<any>(`/mock-tests/${id}`, {
      method: "PUT",
      body: JSON.stringify(test),
    });
    if (res.success && res.data) {
      res.data.questions = res.data.questions || [];
    }
    return res;
  }

  async deleteMockTest(id: string) {
    return this.request<any>(`/mock-tests/${id}`, {
      method: "DELETE",
    });
  }

  async addQuestionToMockTest(testId: string, question: any) {
    return this.request<any>(`/mock-tests/${testId}/questions`, {
      method: "POST",
      body: JSON.stringify(question),
    });
  }

  async getQuestionsByMockTestId(mockTestId: string) {
    return this.request<any[]>(`/questions?mockTestId=${mockTestId}`);
  }

  // -------------------------------
  // --- Test Results (CORRECTED) ---
  // -------------------------------
  
  /**
   * Submits a new test result. Uses TestResultPayload interface.
   */
  async submitTestResult(result: TestResultPayload) {
    return this.request<any>("/test-results", {
      method: "POST",
      body: JSON.stringify(result),
    });
  }

  /**
   * Fetches paginated test results. Uses studentUserNo for admin filtering.
   */
// --- Test Results ---
async getTestResults(studentUserNo?: string | number) {
    // 🛑 FIX: Start with the base endpoint and include a high limit to prevent pagination
    let endpoint = "/test-results?limit=1000"; 

    // Use a high limit (e.g., 1000) to ensure all tests are fetched for progress tracking.
    
    // Now, append the studentUserNo filter if provided (for admin view)
    if (studentUserNo) {
      endpoint += `&studentUserNo=${studentUserNo}`;
    }
    
    // The request method handles the Authorization header and returns the PaginatedTestResults structure.
    return this.request<PaginatedTestResults>(endpoint);
}



  // --- Chapters ---
  async getChapters() {
    return this.request<any[]>("/chapters");
  }

  async createChapter(chapter: { chapter_number: number; chapter_title: string; branch?: string | null; pdfNotes?: any[]; videoTutorials?: any[] }) {
    return this.request<any>("/chapters", {
      method: "POST",
      body: JSON.stringify(chapter),
    });
  }

  async updateChapter(id: string, chapter: any) {
    console.log("Updating chapter with ID:", id);
    return this.request<any>(`/chapters/${id}`, {
      method: "PUT",
      body: JSON.stringify(chapter),
    });
  }

  async deleteChapter(id: string) {
    return this.request<any>(`/chapters/${id}`, {
      method: "DELETE",
    });
  }

  // --- Chapter PDFs ---
  async addPdfToChapter(chapterId: string, pdf: { file_name: string; file: File }) {
    const formData = new FormData();
    formData.append('file_name', pdf.file_name);
    formData.append('pdf_file', pdf.file);

    // Let request() merge authorization headers via getAuthHeaders()
    return this.request<any>(`/chapters/${chapterId}/pdfs`, {
      method: "POST",
      body: formData,
    });
  }

  async deletePdfFromChapter(chapterId: string, pdfId: string) {
    return this.request<any>(`/chapters/${chapterId}/pdfs/${pdfId}`, {
      method: "DELETE",
    });
  }

  // Handle PDF download
  async downloadPdfFromChapter(chapterId: string, pdfId: string): Promise<Response> {
    const token = localStorage.getItem("userToken");
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const url = `${API_BASE_URL}/chapters/${chapterId}/pdfs/${pdfId}/download`;
    return fetch(url, { headers });
  }

  // Get PDF URL for viewing
  async getPdfUrl(chapterId: string, pdfId: string): Promise<string> {
    const url = `${API_BASE_URL}/chapters/${chapterId}/pdfs/${pdfId}/open`;
    return url;
  }

  // Open a protected PDF in a new tab by fetching it with the Authorization header
  // and creating an object URL so the browser can display it inline.
  async openPdfInNewTab(chapterId: string, pdfId: string) {
    try {
      const token = localStorage.getItem("userToken");
      const headers: HeadersInit = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const url = `${API_BASE_URL}/chapters/${chapterId}/pdfs/${pdfId}/open`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText} ${text}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      // Optionally revokeObjectURL after some time to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      console.error("openPdfInNewTab error:", err);
      throw err;
    }
  }

  // --- Chapter Videos ---
  async addVideoToChapter(chapterId: string, video: any) {
    return this.request<any>(`/chapters/${chapterId}/videos`, {
      method: "POST",
      body: JSON.stringify(video),
    });
  }

  async deleteVideoFromChapter(chapterId: string, videoId: string) {
    return this.request<any>(`/chapters/${chapterId}/videos/${videoId}`, {
     method: "DELETE",
    });
  }

  // --- Admin Endpoints ---
  async getUsersCount() {
    return this.request<{ totalUsers: number; totalStudents: number; totalAdmins: number }>("/admin/users-count");
  }
}

export const apiService = new ApiService();