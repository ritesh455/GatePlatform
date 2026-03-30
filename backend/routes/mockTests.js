const express = require("express")
const { body, validationResult, param } = require("express-validator")
const { query } = require("../config/database")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all mock tests (filtered by student's branch)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // 1. Get the logged-in student's branch from the authentication token
    const studentBranch = req.user.branch // ASSUMPTION: Branch is available on req.user

    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const queryParams = [studentBranch, 'ALL', limit, offset];
    
    // 2. Modify the main query to filter by branch ('ALL' or the student's specific branch)
    const result = await query(
      "SELECT mt.*, COUNT(q.id) as question_count " +
      "FROM mock_tests mt LEFT JOIN questions q ON mt.id = q.mock_test_id " +
      "WHERE mt.branch = $1 OR mt.branch = $2 " + // Branch filtering condition
      "GROUP BY mt.id ORDER BY mt.created_at DESC LIMIT $3 OFFSET $4",
      queryParams,
    )

    // 3. Modify the count query to filter by branch
    const countParams = [studentBranch, 'ALL'];
    const countResult = await query(
        "SELECT COUNT(*) FROM mock_tests WHERE branch = $1 OR branch = $2",
        countParams
    )
    const totalCount = Number.parseInt(countResult.rows[0].count)

    res.json({
      tests: result.rows,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get mock tests error:", error)
    res.status(500).json({ error: "Failed to fetch mock tests" })
  }
})

// Get single mock test with questions (access control based on branch)
router.get("/:id", authenticateToken, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid test ID" })
    }

    // Get the logged-in student's branch
    const studentBranch = req.user.branch // ASSUMPTION: Branch is available on req.user

    // 4. Add branch check to the test details query
    const testResult = await query(
        "SELECT * FROM mock_tests WHERE id = $1 AND (branch = $2 OR branch = $3)",
        [req.params.id, studentBranch, 'ALL']
    )

    if (testResult.rows.length === 0) {
      // 404 means either test ID is wrong or the student doesn't have access
      return res.status(404).json({ error: "Mock test not found or access denied" })
    }

    // Get questions for this test (no branch filter needed here, it's filtered above)
    const questionsResult = await query("SELECT * FROM questions WHERE mock_test_id = $1 ORDER BY created_at", [
      req.params.id,
    ])

    const test = testResult.rows[0]
    test.questions = questionsResult.rows

   res.json(test);

  } catch (error) {
    console.error("Get mock test error:", error)
    res.status(500).json({ error: "Failed to fetch mock test" })
  }
})

// Create mock test (admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
    body("description").optional().trim(),
    body("duration").isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
    // 5. Add validation for the new 'branch' field
    body("questions").optional().isArray().withMessage("Questions must be an array"),
    body("questions.*.question").optional().trim().isLength({ min: 1 }).withMessage("Question text is required"),
    body("questions.*.options").optional().isArray({ min: 2 }).withMessage("At least 2 options are required"),
    body("questions.*.correctAnswer").optional().isInt({ min: 0 }).withMessage("Correct answer index is required"),
    body("questions.*.explanation").optional().trim(),
    body("questions.*.subject").optional().trim(),
    body("questions.*.difficulty").optional().isIn(["Easy", "Medium", "Hard"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      // 6. Destructure the new branch field
      const { title, description, duration , questions = [] } = req.body
      const branch = req.user.branch;
      // Start transaction
      const client = await require("../config/database").pool.connect()
      try {
        await client.query("BEGIN")

        // 7. Update INSERT query to store the branch
        const testResult = await client.query(
          "INSERT INTO mock_tests (title, description, duration, branch) VALUES ($1, $2, $3, $4) RETURNING *",
          [title, description || "", duration, branch],
        )

        const testId = testResult.rows[0].id

        // Create questions only if there are any
        for (const question of questions) {
          await client.query(
            "INSERT INTO questions (mock_test_id, question, options, correct_answer, explanation, subject, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [
              testId,
              question.question,
              JSON.stringify(question.options),
              question.correctAnswer,
              question.explanation || "",
              question.subject || "",
              question.difficulty || "Medium",
            ],
          )
        }

        await client.query("COMMIT")

        // Return the test with questions (if any)
        const completeTest = await query(
  "SELECT mt.*, json_agg(q.*) as questions FROM mock_tests mt LEFT JOIN questions q ON mt.id = q.mock_test_id WHERE mt.id = $1 GROUP BY mt.id",
  [testId],
)


        res.status(201).json({
          message: "Mock test created successfully",
          test: completeTest.rows[0],
        })
      } catch (error) {
        await client.query("ROLLBACK")
        throw error
      } finally {
        client.release()
      }
    } catch (error) {
      console.error("Create mock test error:", error)
      res.status(500).json({ error: "Failed to create mock test" })
    }
  },
)


// Update mock test (admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isUUID(),
    body("title").optional().trim().isLength({ min: 1 }),
    body("description").optional().trim(),
    body("duration").optional().isInt({ min: 1 }),
    // 8. Add optional validation for the 'branch' field
    body("branch").optional().trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      // 9. Destructure the new branch field
      const { title, description, duration, branch } = req.body
      const updates = []
      const values = []

      if (title !== undefined) {
        updates.push(`title = $${updates.length + 1}`)
        values.push(title)
      }
      if (description !== undefined) {
        updates.push(`description = $${updates.length + 1}`)
        values.push(description)
      }
      if (duration !== undefined) {
        updates.push(`duration = $${updates.length + 1}`)
        values.push(duration)
      }
      // 10. Add logic to update the new branch field
      if (branch !== undefined) {
        updates.push(`branch = $${updates.length + 1}`)
        values.push(branch)
      }


      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" })
      }

      values.push(req.params.id)
      const result = await query(
        `UPDATE mock_tests SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${
          values.length
        } RETURNING *`,
        values,
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Mock test not found" })
      }

      res.json({
        message: "Mock test updated successfully",
        test: result.rows[0],
      })
    } catch (error) {
      console.error("Update mock test error:", error)
      res.status(500).json({ error: "Failed to update mock test" })
    }
  },
)

// Delete mock test (admin only)
router.delete("/:id", authenticateToken, requireAdmin, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid test ID" })
    }

    const result = await query("DELETE FROM mock_tests WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mock test not found" })
    }

    res.json({ message: "Mock test deleted successfully" })
  } catch (error) {
    console.error("Delete mock test error:", error)
    res.status(500).json({ error: "Failed to delete mock test" })
  }
})

module.exports = router
// Add a question to an existing mock test (admin only)
router.post(
  "/:id/questions",
  authenticateToken,
  requireAdmin,
  [
    param("id").isUUID(),
    body("question").trim().isLength({ min: 1 }).withMessage("Question text is required"),
    body("options").isArray({ min: 2 }).withMessage("At least 2 options are required"),
    body("correctAnswer").isInt({ min: 0 }).withMessage("Correct answer index is required"),
    body("explanation").optional().trim(),
    body("subject").optional().trim(),
    body("difficulty").optional().isIn(["Easy", "Medium", "Hard"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
      }

      const { question, options, correctAnswer, explanation = "", subject = "", difficulty = "Medium" } = req.body;
      const mockTestId = req.params.id;

      // Check if mock test exists (No branch check needed here since the admin is managing questions for an existing test)
      const testResult = await query("SELECT id FROM mock_tests WHERE id = $1", [mockTestId]);
      if (testResult.rows.length === 0) {
        return res.status(404).json({ error: "Mock test not found" });
      }

      // Insert question
      const insertResult = await query(
        "INSERT INTO questions (mock_test_id, question, options, correct_answer, explanation, subject, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          mockTestId,
          question,
          JSON.stringify(options),
          correctAnswer,
          explanation,
          subject,
          difficulty,
        ]
      );

      res.status(201).json({ message: "Question added successfully", question: insertResult.rows[0] });
    } catch (error) {
      console.error("Add question error:", error);
     res.status(500).json({ error: "Failed to add question" });
    }
  }
);