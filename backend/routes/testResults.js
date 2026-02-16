const express = require("express")
const { body, validationResult, param } = require("express-validator")
const { query } = require("../config/database")
const { authenticateToken, requireOwnershipOrAdmin } = require("../middleware/auth")

const router = express.Router()

// Utility function to validate the necessary user ID is available
const validateUserNo = (req, res, next) => {
    // This check ensures the token payload contains the userNo field
    if (req.user.role === "student" && !req.user.userNo) { 
        return res.status(401).json({ error: "Malformed token: Student identifier (userNo) missing." });
    }
    next();
};

// --- GET All Results (Correct) ---
router.get("/", authenticateToken, validateUserNo, async (req, res) => { // Added validateUserNo
    // ... (Your correct GET logic for list/pagination here)
    try {
        const { page = 1, limit = 10, testId } = req.query
        const offset = (page - 1) * limit
        const studentUserNo = req.user.userNo 

        let queryText = `
            SELECT 
                tr.*,
                mt.title as test_title,
                s.username as user_name,
                s.email as user_email
            FROM test_results tr
            JOIN mock_tests mt ON tr.test_id = mt.id
            JOIN student s ON tr.student_user_no = s.user_no 
        `
        const queryParams = []
        const whereConditions = []
        let paramIndex = 1;

        if (req.user.role !== "admin") {
            whereConditions.push(`tr.student_user_no = CAST($${paramIndex} AS BIGINT)`)
            queryParams.push(studentUserNo)
            paramIndex++
        }

        if (testId) {
            whereConditions.push(`tr.test_id = $${paramIndex}`)
            queryParams.push(testId)
            paramIndex++
        }

        if (whereConditions.length > 0) {
            queryText += " WHERE " + whereConditions.join(" AND ")
        }

        queryText += ` ORDER BY tr.completed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        queryParams.push(limit, offset)

        const result = await query(queryText, queryParams)

        // Count query logic... 
        let countQuery = "SELECT COUNT(*) FROM test_results tr"
        const countParams = []
        let countParamIndex = 1; 

        if (req.user.role !== "admin") {
            countQuery += ` WHERE tr.student_user_no = CAST($${countParamIndex} AS BIGINT)`
            countParams.push(studentUserNo)
            countParamIndex++
            if (testId) {
                countQuery += ` AND tr.test_id = $${countParamIndex}`
                countParams.push(testId)
                countParamIndex++
            }
        } else if (testId) {
            countQuery += ` WHERE tr.test_id = $${countParamIndex}`
            countParams.push(testId)
            countParamIndex++
        }

        const countResult = await query(countQuery, countParams)
        const totalCount = Number.parseInt(countResult.rows[0].count)

        res.json({
            results: result.rows,
            pagination: {
                currentPage: Number.parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNext: offset + limit < totalCount,
                hasPrev: page > 1,
            },
        })
    } catch (error) {
        console.error("Get test results error:", error)
        res.status(500).json({ error: "Failed to fetch test results" })
    }
})

// --- Submit test result (FINAL, ROBUST FIX) ---
router.post(
    "/",
    authenticateToken,
    validateUserNo, 
    [
        body("testId").isUUID().withMessage("Valid test ID is required"),
        // Use isNumeric for tolerance, relying on subsequent explicit Number() call for insertion
        body("score").isNumeric().withMessage("Score must be a non-negative number"),
        body("total_questions").isNumeric().withMessage("Total questions must be a number"),
        body("timeTaken").isNumeric().withMessage("Time taken must be a non-negative number"),
        body("answers").isArray().withMessage("Answers must be an array"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                console.error("Validation failed for:", req.body);
                return res.status(400).json({
                    error: "Validation failed",
                    details: errors.array(),
                })
            }

            // --- Data Acquisition and Parsing ---
            const { testId, score, total_questions, timeTaken, answers } = req.body
            
            // 🛑 FINAL FIX FOR BIGINT/NaN: Safely convert user ID and other numerics
            // Use Number() on incoming body fields for DB insertion
            const studentUserNo = Number(req.user.userNo); 
            const finalScore = Number(score);
            const finalTotalQuestions = Number(total_questions);
            const finalTimeTaken = Number(timeTaken);
            
            // Check for NaN after conversion (safety guard against the crash)
            if (isNaN(studentUserNo)) {
                // This should not be reached if validateUserNo is used, but it's a final guard.
                return res.status(400).json({ error: "Invalid user identifier from token." });
            }

            
            // 1. SAFETY CHECK 1: Verify Test exists
            const testCheck = await query("SELECT id FROM mock_tests WHERE id = $1", [testId])
            if (testCheck.rows.length === 0) {
                return res.status(404).json({ error: "Test not found" })
            }
            
            // 2. SAFETY CHECK 2: Verify Student exists
            const studentCheck = await query("SELECT user_no FROM student WHERE user_no = $1", [studentUserNo]);
            if (studentCheck.rows.length === 0) {
                console.error(`Submission FK violation: User ${studentUserNo} not found.`);
                return res.status(404).json({ error: "Authenticated student record missing." });
            }


           // 3. Final INSERT
           const result = await query(
            // FIX SQL: Use $2 parameter without CAST; the driver will handle the Number -> BIGINT conversion.
            "INSERT INTO test_results (test_id, student_user_no, score, total_questions, time_taken, answers) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
             [testId, studentUserNo, finalScore, finalTotalQuestions, finalTimeTaken, JSON.stringify(answers)], 
            )

            res.status(201).json({
                message: "Test result submitted successfully",
                result: result.rows[0],
            })
        } catch (error) {
            console.error("Submit test result error:", error)
            res.status(500).json({ error: "Failed to submit test result" })
       }
    },
)

// --- GET Single Test Result (Correct) ---
router.get("/:id", authenticateToken, validateUserNo, param("id").isUUID(), async (req, res) => { // Added validateUserNo
    // ... (Your correct GET /:id logic here)
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "Invalid result ID" })
        }
        
        const studentUserNo = req.user.userNo

        let queryText = `
            SELECT 
                tr.*,
                mt.title as test_title,
                s.username as user_name,
                s.email as user_email
            FROM test_results tr
            JOIN mock_tests mt ON tr.test_id = mt.id
            JOIN student s ON tr.student_user_no = s.user_no 
            WHERE tr.id = $1 
        `
        const queryParams = [req.params.id]
        let paramIndex = 2; 

        // Non-admin users can only see their own results
        if (req.user.role !== "admin") {
            queryText += ` AND tr.student_user_no = CAST($${paramIndex} AS BIGINT)`
            queryParams.push(studentUserNo)
        }

        const result = await query(queryText, queryParams)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Test result not found" })
        }

        res.json({ result: result.rows[0] })
    } catch (error) {
        console.error("Get test result error:", error)
        res.status(500).json({ error: "Failed to fetch test result" })
    }
})

// --- GET User Statistics (Correct) ---
router.get("/stats/user", authenticateToken, validateUserNo, async (req, res) => { // Added validateUserNo
    // ... (Your correct GET /stats/user logic here)
    try {
        const targetUserNo = req.user.role === "admin" && req.query.studentUserNo 
                               ? req.query.studentUserNo 
                               : req.user.userNo

        const stats = await query(
            `
            SELECT 
                COUNT(*) as total_tests_taken,
                AVG(score::float / total_questions * 100) as average_percentage,
                MAX(score::float / total_questions * 100) as best_percentage,
                AVG(time_taken) as average_time_taken,
                COUNT(CASE WHEN score::float / total_questions >= 0.8 THEN 1 END) as tests_passed
            FROM test_results 
            WHERE student_user_no = CAST($1 AS BIGINT)
            `,
            [targetUserNo],
        )

        const recentResults = await query(
            `
            SELECT 
                tr.score,
                tr.total_questions,
                tr.completed_at,
                mt.title as test_title
            FROM test_results tr
            JOIN mock_tests mt ON tr.test_id = mt.id
            WHERE tr.student_user_no = CAST($1 AS BIGINT)
            ORDER BY tr.completed_at DESC
            LIMIT 5
            `,
            [targetUserNo],
        )

        res.json({
            stats: stats.rows[0],
            recentResults: recentResults.rows,
        })
    } catch (error) {
        console.error("Get user stats error:", error)
       res.status(500).json({ error: "Failed to fetch user statistics" })
    }
})

module.exports = router