"use client";

import React, { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { apiService } from "../services/api";

/* ---------- Types ---------- */

type TestHistory = {
  test_id: string;
  test_title: string;
  attempt_count: number;
};

type TestAttempt = {
  email: string;
  city: string;
  state: string;
  score: number;
  total_questions: number;
  completed_at?: string;
  created_at?: string;
};

// Added strict interfaces for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface TestHistoryData {
  tests?: TestHistory[];
}

interface TestAttemptsData {
  attempts?: TestAttempt[];
}

/* ---------- Component ---------- */

const TestHistory: React.FC = () => {
  const [tests, setTests] = useState<TestHistory[]>([]);
  const [attempts, setAttempts] = useState<Record<string, TestAttempt[]>>({});
  const [openTest, setOpenTest] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  /* ---------- Fetch Tests ---------- */

  const fetchTests = async (): Promise<void> => {
    try {
      // Cast the response to handle strict property checking
      const res = (await apiService.getTestHistory(search)) as ApiResponse<TestHistoryData | TestHistory[]>;

      if (res.success) {
        const data = res.data;

        // Use type guards instead of 'any'
        const testsData = Array.isArray(data)
          ? data
          : Array.isArray((data as TestHistoryData)?.tests)
          ? (data as TestHistoryData).tests || []
          : [];

        setTests(testsData);
      }
    } catch (err) {
      console.error("Failed to load tests:", err);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [search]);

  /* ---------- Toggle Test ---------- */

  const toggleTest = async (testId: string): Promise<void> => {
    if (openTest === testId) {
      setOpenTest(null);
      return;
    }

    setOpenTest(testId);

    if (!attempts[testId]) {
      try {
        const res = (await apiService.getTestAttempts(testId)) as ApiResponse<TestAttemptsData | TestAttempt[]>;

        console.log("Attempts response:", res);

        if (res.success) {
          const data = res.data;

          // Use type guards instead of 'any'
          const attemptsData = Array.isArray(data)
            ? data
            : Array.isArray((data as TestAttemptsData)?.attempts)
            ? (data as TestAttemptsData).attempts || []
            : [];

          setAttempts((prev) => ({
            ...prev,
            [testId]: attemptsData,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch attempts:", err);
      }
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Test History</h1>

      {/* Search */}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />

        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tests */}

      <div className="space-y-4">
        {tests.map((test) => (
          <div
            key={test.test_id}
            className="border rounded-lg bg-white shadow-sm"
          >
            {/* Header */}

            <div
              onClick={() => toggleTest(test.test_id)}
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50"
            >
              <div>
                <h3 className="font-semibold text-lg">{test.test_title}</h3>

                <p className="text-sm text-slate-500">
                  Attempts: {test.attempt_count}
                </p>
              </div>

              {openTest === test.test_id ? <ChevronUp /> : <ChevronDown />}
            </div>

            {/* Attempts Table */}

            {openTest === test.test_id && (
              <div className="p-4 border-t">
                <div className="overflow-x-auto"> {/* Added wrapper for table safety */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Email</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Score</th>
                        <th>Attempt Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(attempts[test.test_id] ?? []).length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4 text-slate-500"
                          >
                            No attempts found
                          </td>
                        </tr>
                      )}

                      {(attempts[test.test_id] ?? []).map((a, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">{a.email}</td>
                          <td>{a.city}</td>
                          <td>{a.state}</td>
                          <td>
                            {a.score}/{a.total_questions}
                          </td>
                          <td>
                            {new Date(
                              a.completed_at || a.created_at || ""
                            ).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestHistory;