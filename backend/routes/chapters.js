const express = require("express");
const { body, validationResult, param } = require("express-validator");
const { query } = require("../config/database");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

// --- FILE STORAGE CONFIGURATION ---
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "educational_platform", // your folder
    resource_type: "auto", // VERY IMPORTANT (supports all files)
  },
});

const upload = multer({ storage });

const router = express.Router();

const normalizeChapter = (c) => ({
  ...c,
  pdfNotes: (c.pdf_note || []).map(p => ({
    ...p,
    // Add any other normalization needed for PDFs if they are not already camelCase
  })),
  videoTutorials: (c.video_tutorials || []).map(v => ({
    id: v.id,
    title: v.title,
    youtubeUrl: v.youtube_url, // Correctly map youtube_url
    duration: v.duration,
    addedAt: v.added_at, // Correctly map added_at
  })),
});
// Get all chapters with their content (filtered by student's branch)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Extract student's branch and role from JWT token (req.user populated by authenticateToken middleware)
    const studentBranch = req.user?.branch;
    const userRole = req.user?.role;
    const userEmail = req.user?.email;

    // console.log("=== CHAPTERS FETCH DEBUG ===");
    // console.log("User Email:", userEmail);
    // console.log("User Role:", userRole);
    // console.log("User Branch:", studentBranch);
    // console.log("Full req.user:", req.user);
    // console.log("=============================");

    // Build WHERE clause based on user role
    let whereClause = "";
    let params = [];

    // 1. Student Logic: See own branch + 'ALL' content
    if (userRole === "student" && studentBranch) {
      whereClause = "WHERE c.branch = $1 OR c.branch = $2";
      params = [studentBranch, 'ALL']; // Filter by student's branch OR 'ALL'
      // console.log(`[Chapters] APPLYING FILTER: Student from branch '${studentBranch}'`);
    } else if (userRole === "student" && !studentBranch) {
      // Students without a branch see only 'ALL' chapters (assuming 'ALL' is the default common content tag)
      whereClause = "WHERE c.branch = $1";
      params = ['ALL'];
      // console.log(`[Chapters] WARNING: Student has no branch assigned - showing 'ALL' chapters only.`);
    } 
    // 2. MODIFIED Admin Logic: If not a student, restrict by their own branch
    else if (studentBranch) { 
        whereClause = "WHERE c.branch = $1";
        params = [studentBranch];
        // console.log(`[Chapters] APPLYING ADMIN FILTER: Admin restricted to branch '${studentBranch}' chapters.`);
    }
    // 3. Super Admin/Unassigned User Logic: No filter applied
    else {
      // console.log(`[Chapters] NO FILTER: Admin user without assigned branch/Super Admin - showing all chapters`);
    }

    const query_text = `
      SELECT 
        c.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', p.id,
            'file_name', p.file_name,
            'url', p.file_path,
            'uploadedAt', p.created_at
          )) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS pdf_note,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', v.id,
            'title', v.title,
            'youtubeUrl', v.youtube_url,
            'duration', v.duration,
            'addedAt', v.added_at
          )) FILTER (WHERE v.id IS NOT NULL), '[]'
        ) AS video_tutorials
      FROM chapters c
      LEFT JOIN pdf_note p ON c.id = p.chapter_id
      LEFT JOIN video_tutorials v ON c.id = v.chapter_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.chapter_number
    `;

    // console.log("Query text:", query_text);
    // console.log("Query params:", params);

    const result = await query(query_text, params);

    // console.log(`[Chapters] Returned ${result.rows.length} chapters`);
    
    const chapters = result.rows.map(normalizeChapter);
    res.json({ success: true, data: chapters });
  } catch (error) {
    console.error("Get chapters error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chapters" });
  }
});

// Get single chapter (with branch access check for students)
router.get("/:id", authenticateToken, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: "Invalid chapter ID" });

    const userRole = req.user?.role;
    const studentBranch = req.user?.branch;
    const chapterId = req.params.id;

    let whereCondition = "c.id = $1";
    let params = [chapterId];

    // MODIFIED: Restrict students to their own branch or 'ALL' content
    if (userRole === "student" && studentBranch) {
      whereCondition += " AND (c.branch = $2 OR c.branch = $3)";
      params.push(studentBranch, 'ALL');
    } else if (userRole === "student" && !studentBranch) {
      // Student without a branch can only see 'ALL' content
      whereCondition += " AND c.branch = $2";
      params.push('ALL');
    }

    const result = await query(`
      SELECT 
        c.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', p.id,
            'file_name', p.file_name,
            'url', p.file_path,
            'uploadedAt', p.created_at
          )) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS pdf_note,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', v.id,
            'title', v.title,
            'youtubeUrl', v.youtube_url,
            'duration', v.duration,
            'addedAt', v.added_at
          )) FILTER (WHERE v.id IS NOT NULL), '[]'
        ) AS video_tutorials
      FROM chapters c
      LEFT JOIN pdf_note p ON c.id = p.chapter_id
      LEFT JOIN video_tutorials v ON c.id = v.chapter_id
      WHERE ${whereCondition}
      GROUP BY c.id
    `, params);

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Chapter not found or access denied" });

    res.json({ success: true, data: normalizeChapter(result.rows[0]) });
  } catch (error) {
    console.error("Get chapter error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chapter" });
  }
});

// Create chapter (admin only - automatically assigns admin's branch)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("chapter_number").isInt({ min: 1 }).withMessage("Chapter number must be a positive integer"),
    body("chapter_title").trim().isLength({ min: 1 }).withMessage("Chapter title is required"),
    // MODIFIED: Removed branch validation as it's auto-inserted
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed", details: errors.array() });
      }

      // Get the admin's branch from the authentication token
      const adminBranch = req.user.branch; // ASSUMPTION: Admin branch is available on req.user

      // MODIFIED: Removed branch from destructuring
      const { chapter_number, chapter_title } = req.body;
      
      // console.log(`[Chapters] Creating chapter: ${chapter_title} (${chapter_number}) for branch: ${adminBranch}`);
      
      // MODIFIED: Insert adminBranch into the query
      const result = await query(
        "INSERT INTO chapters (chapter_number, chapter_title, branch) VALUES ($1, $2, $3) RETURNING *",
        [chapter_number, chapter_title, adminBranch]
      );

      res.status(201).json({ success: true, data: normalizeChapter(result.rows[0]) });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(400).json({ success: false, message: "Chapter number already exists" });
      }
      console.error("Create chapter error:", error);
      res.status(500).json({ success: false, message: "Failed to create chapter" });
    }
  }
);

// Add PDF to chapter (admin only - with branch ownership check)
router.post(
  "/:id/pdfs",
  authenticateToken,
  requireAdmin,
  upload.single("pdf_file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No PDF file uploaded" });
      }

      const adminBranch = req.user.branch;
      const chapterId = req.params.id;

      // ADDED: Check if chapter exists AND belongs to the admin's branch
      const chapterCheck = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
      if (chapterCheck.rows.length === 0)
        return res.status(403).json({ success: false, message: "Access denied: You can only add content to chapters for your assigned branch." });

      const result = await query(
        // CORRECTED: Return 'file_path' along with other fields
        "INSERT INTO pdf_note (chapter_id, file_name, file_path) VALUES ($1, $2, $3) RETURNING id, file_name, file_path, created_at",
        [chapterId, req.file.originalname, req.file.path]
      );

      const pdf = result.rows[0];

      // CORRECTED: Construct the full URL here before sending the response
      const pdfWithUrl = {
        ...pdf,
        url: pdf.file_path,
      };

      res.status(201).json({ success: true, data: pdfWithUrl });
    } catch (error) {
      console.error("Add PDF error:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to add PDF to chapter" });
    }
  }
);

// Add a new route to open the PDF directly (student access remains the same, but restricted by the chapter GET)
router.get("/:chapterId/pdfs/:pdfId/open", authenticateToken, param("chapterId").isUUID(), param("pdfId").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }
    
    // ADDED: Access check to prevent students from viewing PDFs attached to chapters they shouldn't see
    const userRole = req.user?.role;
    const studentBranch = req.user?.branch;
    
    let accessCondition = `c.id = $1 AND p.id = $2`;
    const params = [req.params.chapterId, req.params.pdfId];

    if (userRole === "student") {
        accessCondition += " AND (c.branch = $3 OR c.branch = $4)";
        params.push(studentBranch || 'NONE', 'ALL'); // Use 'NONE' if no branch is set, but still restrict
    }


    const result = await query(`
        SELECT p.file_path 
        FROM pdf_note p
        JOIN chapters c ON p.chapter_id = c.id
        WHERE ${accessCondition}
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "PDF not found or access denied" });
    }

    const { file_path } = result.rows[0];
    // const absolutePath = path.join(uploadDir, file_path);

    // Set headers for in-browser viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Key change for viewing

    // Read the file and send it
    return res.redirect(file_path);

  } catch (error) {
    console.error("PDF open error:", error);
    res.status(500).json({ success: false, message: "Failed to open PDF" });
  }
});


// Add Video to chapter (admin only - with branch ownership check)
router.post(
  "/:id/videos",
  authenticateToken,
  requireAdmin,
  [
    param("id").isUUID(),
    body("title").trim().isLength({ min: 1 }),
    body("youtubeUrl").isURL(),
    body("duration").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ success: false, message: "Validation failed", details: errors.array() });

      const { title, youtubeUrl, duration } = req.body;
      const adminBranch = req.user.branch;
      const chapterId = req.params.id;

      // ADDED: Check if chapter exists AND belongs to the admin's branch
      const chapterCheck = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
      if (chapterCheck.rows.length === 0)
        return res.status(403).json({ success: false, message: "Access denied: You can only add content to chapters for your assigned branch." });

      const result = await query(
        "INSERT INTO video_tutorials (chapter_id, title, youtube_url, duration) VALUES ($1, $2, $3, $4) RETURNING *",
        [chapterId, title, youtubeUrl, duration || null]
      );

      // Your code already returns this, which is good.
      // The frontend should receive `result.rows[0]`
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error("Add video error:", error);
      res.status(500).json({ success: false, message: "Failed to add video to chapter" });
    }
  }
);




// Update chapter (admin only - with branch ownership check)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const chapterId = req.params.id;
  // MODIFIED: Removed branch from destructuring (it cannot be updated by admin)
  const { chapter_number, chapter_title } = req.body;
  const adminBranch = req.user.branch;

  try {
    // ADDED: Check if chapter belongs to the admin's branch before updating
    const chapterCheck = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
    if (chapterCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Access denied: You can only update chapters for your assigned branch." });
    }

    // MODIFIED: Removed branch from the UPDATE statement
    await query(
      "UPDATE chapters SET chapter_number=$1, chapter_title=$2 WHERE id=$3",
      [chapter_number, chapter_title, chapterId]
    );

    const result = await query(
      `
      SELECT
        c.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', p.id,
            'file_name', p.file_name,
            'url', p.file_path,
            'uploadedAt', p.created_at
          )) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS pdf_note,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', v.id,
            'title', v.title,
            'youtubeUrl', v.youtube_url,
            'duration', v.duration,
            'addedAt', v.added_at
          )) FILTER (WHERE v.id IS NOT NULL), '[]'
        ) AS video_tutorials
      FROM chapters c
      LEFT JOIN pdf_note p ON c.id = p.chapter_id
      LEFT JOIN video_tutorials v ON c.id = v.chapter_id
      WHERE c.id = $1
      GROUP BY c.id
      `,
      [chapterId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Chapter not found" });

    res.json({ message: "Chapter updated successfully", data: normalizeChapter(result.rows[0]) });
  } catch (err) {
    console.error("Update chapter error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a PDF from chapter (admin only - with chapter ownership check)
router.delete("/:chapterId/pdfs/:pdfId", authenticateToken, requireAdmin, async (req, res) => {
  const { chapterId, pdfId } = req.params;
  const adminBranch = req.user.branch;

  try {
    // ADDED: Check if chapter belongs to the admin's branch before allowing content deletion
    const chapterCheck = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
    if (chapterCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Access denied: Cannot delete content from this chapter." });
    }

    const fileResult = await query("SELECT file_path FROM pdf_note WHERE id = $1 AND chapter_id = $2", [pdfId, chapterId]);
    if (fileResult.rows.length === 0) return res.status(404).json({ success: false, message: "PDF not found" });

    const fileName = fileResult.rows[0].file_path;
    // const filePath = path.join(uploadDir, fileName);

    const deleteResult = await query("DELETE FROM pdf_note WHERE id = $1 AND chapter_id = $2 RETURNING *", [pdfId, chapterId]);
    if (deleteResult.rows.length === 0) return res.status(404).json({ success: false, message: "PDF not found" });

    // await fs.unlink(filePath);
    // await cloudinary.uploader.destroy(public_id, {
    //   resource_type: "auto"
    // });

    res.json({ success: true, message: "PDF deleted successfully" });
  } catch (error) {
    console.error("Delete PDF error:", error);
    res.status(500).json({ success: false, message: "Failed to delete PDF" });
  }
});

// Delete a Video from chapter (admin only - with chapter ownership check)
router.delete("/:chapterId/videos/:videoId", authenticateToken, requireAdmin, async (req, res) => {
  const { chapterId, videoId } = req.params;
  const adminBranch = req.user.branch;

  // ADDED: Check if chapter belongs to the admin's branch before allowing content deletion
  const chapterCheck = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
  if (chapterCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied: Cannot delete content from this chapter." });
  }

  const result = await query("DELETE FROM video_tutorials WHERE id = $1 AND chapter_id = $2 RETURNING *", [videoId, chapterId]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Video not found" });
  res.json({ success: true, message: "Video deleted successfully" });
});

// Delete chapter (admin only - with branch ownership check)
router.delete("/:id", authenticateToken, requireAdmin, param("id").isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: "Invalid chapter ID" });

    const chapterId = req.params.id;
    const adminBranch = req.user.branch;

    // ADDED: Ownership check before deletion
    const checkResult = await query("SELECT id FROM chapters WHERE id = $1 AND branch = $2", [chapterId, adminBranch]);
    if (checkResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Access denied: You can only delete chapters for your assigned branch." });
    }

    const result = await query("DELETE FROM chapters WHERE id = $1 RETURNING *", [chapterId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Chapter not found" });

    res.json({ success: true, message: "Chapter deleted successfully" });
  } catch (error) {
    console.error("Delete chapter error:", error);
    res.status(500).json({ success: false, message: "Failed to delete chapter" });
  }
});

module.exports = router;