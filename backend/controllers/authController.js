const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Corrected path to config/database.js and import the whole object
const db = require('../config/database'); 
const fs = require('fs'); // Need fs for file deletion on error

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Register Controller
const register = async (req, res) => {
  // Use pool from the imported db object
  const client = await db.pool.connect(); 

  try {
    // req.body contains text fields after Multer processes the form
    const { username, email, password, role, branch, gender, city, state, phone } = req.body;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (role === 'student') {
      // Logic for Student Registration
      
      const checkQuery = 'SELECT * FROM student WHERE email = $1 OR username = $2';
      const checkResult = await client.query(checkQuery, [email, username]);

      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists',
        });
      }

      const insertQuery = `
        INSERT INTO student (username, email, password_hash, role, branch, gender, city, state)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_no, username, email, role, branch, gender, city, state, created_at
      `;

      const result = await client.query(insertQuery, [
        username,
        email,
        passwordHash,
        role,
        branch,
        gender,
        city,
        state,
      ]);

      return res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        user: result.rows[0],
      });
    } else if (role === 'admin') {
      // Logic for Admin Registration
      
      const checkQuery = 'SELECT * FROM admins WHERE email = $1 OR username = $2';
      const checkResult = await client.query(checkQuery, [email, username]);

      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email or username already exists',
        });
      }

      // Check if file exists and get its path
      const degreePath = req.file ? `/uploads/${req.file.filename}` : null;
      
      const insertQuery = `
        INSERT INTO admins (username, email, password_hash, role, phone, branch, degree_file, request_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, admin_no, username, email, role, phone, branch, request_status, created_at
      `;

      const result = await client.query(insertQuery, [
        username,
        email,
        passwordHash,
        role,
        phone,
        branch,
        degreePath, // Inserting the path, not the buffer
        'pending',
      ]);

      
      return res.status(201).json({
        success: true,
        message: 'Admin registration request submitted. Waiting for approval.',
        user: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Clean up uploaded file on failure
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file on registration failure:', err);
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  register,
};