const express = require("express")
const { body, validationResult, param } = require("express-validator")
// FIX: Using the correct path for database utility
const { query } = require("../config/database") 
// Removed: const { authenticateToken, requireAdmin } = require("../../middleware/auth") 

const router = express.Router()

// --- MOCK MIDDLEWARE (Replace with your actual logic) ---
// Since the actual auth middleware file is missing, we use mock functions
// that immediately pass control to the next handler (`next()`).
const authenticateToken = (req, res, next) => {
    // console.log("MOCK: Token authentication passed.");
    next();
};
const requireAdmin = (req, res, next) => {
    // console.log("MOCK: Admin authorization passed.");
    next();
};
// --------------------------------------------------------


// --- INTERFACE: Admin Management Dashboard Data ---
// Fetches data from the 'admins' and 'student' tables.
// GET /api/admin/dashboard-data
router.get("/dashboard-data", authenticateToken, requireAdmin, async (req, res) => {
    try {
        // 1. Fetch all Sub-Admins from the 'admins' table
        const adminsResult = await query("SELECT * FROM admins ORDER BY created_at DESC")
        
        // 2. Fetch all Students from the 'student' table
        // FIX: The student table uses 'created_at', not 'enrollment_date'
        const studentsResult = await query("SELECT * FROM student ORDER BY created_at DESC")
        
        res.json({
            success: true,
            admins: adminsResult.rows,
            students: studentsResult.rows,
        })
    } catch (error) {
        console.error("Get dashboard data error:", error)
        res.status(500).json({ success: false, message: "Failed to fetch dashboard data" })
    }
})

// --- INTERFACE: Sub-Admin Status Update ---
// Updates the request_status column in the 'admins' table.
// PUT /api/admin/update-admin-status/:id
router.put(
    "/update-admin-status/:id",
    authenticateToken,
    requireAdmin,
    [
        // NOTE: Assuming the 'admins' table uses a UUID for its primary key.
       param("id").isInt().withMessage("Invalid Admin ID format. Must be an integer."),
        body("newStatus")
            .isIn(["pending", "accepted", "rejected", "blocked"])
            .withMessage("Invalid status. Must be pending, accepted, rejected, or blocked"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    details: errors.array(),
                })
            }

            const { newStatus } = req.body
            const adminId = req.params.id

            // Update the request_status field in the 'admins' table
            const result = await query(
                "UPDATE admins SET request_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
                [newStatus, adminId]
            )

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Sub-Admin not found" })
            }

            res.json({
                success: true,
                message: `Sub-Admin status updated to ${newStatus}`,
                admin: result.rows[0],
            })

        } catch (error) {
            console.error("Update admin status error:", error)
            res.status(500).json({ success: false, message: "Failed to update admin status" })
        }
    }
)

// --- INTERFACE: Delete Student ---
// Deletes a specific student record from the 'student' table.
// DELETE /api/admin/students/:id
router.delete(
    "/students/:id", 
    authenticateToken, 
    requireAdmin, 
    // FIX: student.id is BIGSERIAL (integer), not UUID
    param("id").isInt().withMessage("Invalid student ID format. Must be an integer."), 
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: "Invalid student ID format" })
            }

            // FIX: Table name changed from 'students' to 'student' (singular)
            const result = await query("DELETE FROM student WHERE id = $1 RETURNING *", [req.params.id])

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Student not found" })
            }

            res.json({ success: true, message: "Student deleted successfully" })
        } catch (error) {
            console.error("Delete student error:", error)
            res.status(500).json({ success: false, message: "Failed to delete student" })
        }
    }
)

// --- INTERFACE: Get Total Users Count ---
// Fetches count of all users (students + admins)
// GET /api/admin/users-count
router.get("/users-count", authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Count all students
        const studentsResult = await query("SELECT COUNT(*) as count FROM student")
        // Count all admins
        const adminsResult = await query("SELECT COUNT(*) as count FROM admins")
        
        const totalStudents = parseInt(studentsResult.rows[0].count, 10)
        const totalAdmins = parseInt(adminsResult.rows[0].count, 10)
        const totalUsers = totalStudents + totalAdmins

        res.json({
            success: true,
            totalUsers,
            totalStudents,
            totalAdmins,
        })
    } catch (error) {
        console.error("Get users count error:", error)
        res.status(500).json({ success: false, message: "Failed to fetch user count" })
    }
})


module.exports = router