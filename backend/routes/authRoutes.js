const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require("../config/database");

// Controllers and Middleware
const { register } = require('../controllers/authController'); 
const { login } = require('../controllers/loginController'); 
const { validateRegistration } = require('../utils/validation');
const { validateLogin } = require('../utils/loginValidation'); 
const { authenticateToken } = require("../middleware/auth"); // Assuming this is the middleware file
const { getUserProfile } = require('../controllers/profileController');

const router = express.Router();

// JWT secret key - Use the same secret as the old file for refresh/verification
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this"; 

// --- Multer Setup ---
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup for file uploads (disk storage is used)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
  }
});


router.get("/search-user", async (req, res) => {

  try {

    const { username } = req.query;

    if (!username) {
      return res.json({
        success: false,
        message: "Enter username to search"
      });
    }

    const result = await db.query(
      `
      SELECT user_no, username
      FROM student
      WHERE username ILIKE $1
      LIMIT 10
      `,
      [`%${username}%`]
    );

    if (result.rows.length === 0) {

      return res.json({
        success: false,
        message: "User not found"
      });

    }

    res.json({
      success: true,
      users: result.rows
    });

  } catch (error) {

    console.error("Search user error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});

// ===============================================
// === PRIMARY AUTH ROUTES (NEW) ===
// ===============================================

// POST /api/auth/register
router.post(
  '/register',
  upload.single('degree_file'), 
  validateRegistration,        
  register                     
);

// POST /api/auth/login
router.post(
  '/login',
  validateLogin, 
  login          
);

// GET /api/auth/profile
router.get("/profile", authenticateToken, getUserProfile);

// ===============================================
// === SECONDARY AUTH ROUTES (PRESERVED) ===
// ===============================================

// Get current user endpoint (Preserved)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const db = require('../config/database'); 
    const result = await db.query("SELECT id, name, email, role, created_at FROM users WHERE id = $1", [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
});

// Logout endpoint (Preserved)
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout successful" });
});

// Refresh token endpoint (Preserved)
router.post("/refresh", authenticateToken, (req, res) => {
  try {
    // Generate new token with same payload
  const dbUser = user.rows[0];


const payload = {
    userId: dbUser.id,
    // 🛑 FIX MAPPING: Map the database field (dbUser.user_no) 
    // to the token field (userNo).
    userNo: dbUser.user_no, 
    role: dbUser.role,
    email: dbUser.email
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

module.exports = router;