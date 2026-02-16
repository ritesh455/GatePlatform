const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database'); 

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Login Controller
const login = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { email, password } = req.body;

    // Check in student table
    let query = 'SELECT *, \'student\' as user_type FROM student WHERE email = $1';
    let result = await client.query(query, [email]);
    let user = result.rows[0];
    let userType = 'student';

    // If not found in student, check in admins table
    if (!user) {
      query = 'SELECT *, \'admin\' as user_type FROM admins WHERE email = $1';
      result = await client.query(query, [email]);
      user = result.rows[0];
      userType = 'admin';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or user not found.',
      });
    }

    // CRITICAL CHECK FOR ADMIN APPROVAL
    if (userType === 'admin' && user.request_status !== 'accepted') {
      return res.status(403).json({
        success: false,
        message: `Admin request is ${user.request_status}. Please wait for approval.`,
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate JWT token (include branch for branch-based filtering)
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        userType: user.user_type,
        userNo: user.user_no,
        branch: user.branch || null  // 🛑 IMPORTANT: Include branch for chapter filtering
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clean up response data
    delete user.password_hash;
    delete user.degree_file; 

    return res.status(200).json({
      success: true,
      message: 'Login successful! Redirecting to dashboard.',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  login,
};