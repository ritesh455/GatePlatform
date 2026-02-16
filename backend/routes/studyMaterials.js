const express = require("express")
const { body, validationResult, param } = require("express-validator")
const { query } = require("../config/database")
const { authenticateToken, requireAdmin } = require("../middleware/auth")

const router = express.Router()

// Get all study materials (with optional filtering)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // 1. Get the logged-in student's branch
    const studentBranch = req.user.branch // ASSUMPTION: Branch is available on req.user

    const { subject, difficulty, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let queryText = "SELECT * FROM study_materials"
    const queryParams = []
    const whereConditions = []

    // 2. Add Branch Filtering Condition
    // The material's branch must match the student's branch OR be marked as 'ALL'
    whereConditions.push(`(branch = $${queryParams.length + 1} OR branch = $${queryParams.length + 2})`)
    queryParams.push(studentBranch, 'ALL')

    if (subject) {
      whereConditions.push(`subject ILIKE $${queryParams.length + 1}`)
      queryParams.push(`%${subject}%`)
    }

    if (difficulty) {
      whereConditions.push(`difficulty = $${queryParams.length + 1}`)
      queryParams.push(difficulty)
    }

    if (whereConditions.length > 0) {
      queryText += " WHERE " + whereConditions.join(" AND ")
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM study_materials"
    const countParams = []
    
    // Reset where conditions for the count query
    const countWhereConditions = []
    
    // 3. Add Branch Filtering to COUNT Query
    countWhereConditions.push(`(branch = $${countParams.length + 1} OR branch = $${countParams.length + 2})`)
    countParams.push(studentBranch, 'ALL')

    if (subject) {
      countWhereConditions.push(`subject ILIKE $${countParams.length + 1}`)
      countParams.push(`%${subject}%`)
    }
    
    if (difficulty) {
      countWhereConditions.push(`difficulty = $${countParams.length + 1}`)
      countParams.push(difficulty)
    }

    if (countWhereConditions.length > 0) {
      countQuery += " WHERE " + countWhereConditions.join(" AND ")
    }

    const countResult = await query(countQuery, countParams)
    const totalCount = Number.parseInt(countResult.rows[0].count)

    res.json({
      materials: result.rows,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Get study materials error:", error)
    res.status(500).json({ error: "Failed to fetch study materials" })
  }
})


// Get single study material
router.get("/:id", authenticateToken, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid material ID" })
    }
    
    // 4. Get the student's branch for single material validation
    const studentBranch = req.user.branch // ASSUMPTION: Branch is available on req.user

    // 5. Modify the query to ensure the student has access to the material
    const result = await query(
        `SELECT * FROM study_materials WHERE id = $1 AND (branch = $2 OR branch = $3)`, 
        [req.params.id, studentBranch, 'ALL']
    )

    if (result.rows.length === 0) {
      // Return 404/403: material not found or student doesn't have permission to view it
      return res.status(404).json({ error: "Study material not found or access denied" })
    }

    res.json({ material: result.rows[0] })
  } catch (error) {
    console.error("Get study material error:", error)
    res.status(500).json({ error: "Failed to fetch study material" })
  }
})


// Create study material (admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
    body("subject").trim().isLength({ min: 1 }).withMessage("Subject is required"),
    body("content").trim().isLength({ min: 1 }).withMessage("Content is required"),
    body("difficulty").isIn(["Easy", "Medium", "Hard"]).withMessage("Difficulty must be Easy, Medium, or Hard"),
    // 6. REMOVE VALIDATION for branch field, as it is automatically inserted by the admin's branch.
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
      
      // Get the admin's branch from the authentication token
      const adminBranch = req.user.branch; // ASSUMPTION: Admin branch is available on req.user

      // 7. Destructure fields (branch is NOT destructured from req.body)
      const { title, subject, content, difficulty } = req.body

      // 8. Update INSERT query to use the admin's branch
      const result = await query(
        "INSERT INTO study_materials (title, subject, content, difficulty, branch) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [title, subject, content, difficulty, adminBranch],
      )

      res.status(201).json({
        message: "Study material created successfully",
        material: result.rows[0],
      })
    } catch (error) {
      console.error("Create study material error:", error)
      res.status(500).json({ error: "Failed to create study material" })
    }
  },
)


// Update study material (admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isUUID(),
    body("title").optional().trim().isLength({ min: 1 }),
    body("subject").optional().trim().isLength({ min: 1 }),
    body("content").optional().trim().isLength({ min: 1 }),
    body("difficulty").optional().isIn(["Easy", "Medium", "Hard"]),
    // 9. REMOVE optional validation for branch field, as admins should not change the branch
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

      // 10. Destructure fields (branch is NOT destructured from req.body)
      const { title, subject, content, difficulty } = req.body
      const updates = []
      const values = []

      if (title !== undefined) {
        updates.push(`title = $${updates.length + 1}`)
        values.push(title)
      }
      if (subject !== undefined) {
        updates.push(`subject = $${updates.length + 1}`)
        values.push(subject)
      }
      if (content !== undefined) {
        updates.push(`content = $${updates.length + 1}`)
        values.push(content)
      }
      if (difficulty !== undefined) {
        updates.push(`difficulty = $${updates.length + 1}`)
        values.push(difficulty)
      }
      // 11. REMOVED logic to update 'branch' field, maintaining it based on creation/original assignment.


      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" })
      }

      // 12. Add check to ensure admin is only updating content for their own branch
      const adminBranch = req.user.branch;
      
      // Check if the material belongs to the admin's branch before updating
      const checkResult = await query("SELECT id FROM study_materials WHERE id = $1 AND branch = $2", [req.params.id, adminBranch]);

      if (checkResult.rows.length === 0) {
          // If the admin is authenticated but tries to update content for another branch
          return res.status(403).json({ error: "Access denied: You can only update materials for your assigned branch." });
      }


      values.push(req.params.id)
      const result = await query(
        `UPDATE study_materials SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${
          values.length
        } RETURNING *`,
        values,
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Study material not found" })
      }

      res.json({
        message: "Study material updated successfully",
        material: result.rows[0],
      })
    } catch (error) {
      console.error("Update study material error:", error)
      res.status(500).json({ error: "Failed to update study material" })
    }
  },
)

// Delete study material (admin only)
router.delete("/:id", authenticateToken, requireAdmin, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Invalid material ID" })
    }
    
    // 13. Add check to ensure admin is only deleting content for their own branch
    const adminBranch = req.user.branch;
    
    // Check if the material belongs to the admin's branch before deleting
    const checkResult = await query("SELECT id FROM study_materials WHERE id = $1 AND branch = $2", [req.params.id, adminBranch]);
    
    if (checkResult.rows.length === 0) {
        return res.status(403).json({ error: "Access denied: You can only delete materials for your assigned branch." });
    }

    const result = await query("DELETE FROM study_materials WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Study material not found" })
    }

    res.json({ message: "Study material deleted successfully" })
  } catch (error) {
    console.error("Delete study material error:", error)
  res.status(500).json({ error: "Failed to delete study material" })
  }
})

module.exports = router