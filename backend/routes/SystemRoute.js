const express = require('express');
const router = express.Router();
// Assuming bcrypt is installed and available
const bcrypt = require('bcrypt'); 
// FIX: Assuming this path is correct for database query function
const { query } = require('../config/database'); 

// --- POST /api/system-admin/login ---
// Endpoint for an EXISTING System Admin to authenticate against the 'systemadmin' table.
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        // 1. Find the admin record by email in the 'systemadmin' table
        const result = await query(
            "SELECT admin_id, email, password_hash, username FROM systemadmin WHERE email = $1", 
            [email]
        );

        if (result.rows.length === 0) {
            // Admin not found
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const admin = result.rows[0];
        
        // 2. REAL PASSWORD COMPARISON: Use bcrypt.compare to verify the plaintext password against the stored hash
        const passwordMatches = await bcrypt.compare(password, admin.password_hash); 

        if (passwordMatches) {
            // Success: Credentials matched
            
            // NOTE: Since the schema doesn't include a 'role', we hardcode 'SystemAdmin' for authorization middleware.
            const authenticatedAdmin = { 
                id: admin.admin_id,
                email: admin.email, 
                username: admin.username,
                role: 'SystemAdmin' 
            };
            
            // In a real system, generate a signed JWT token here
            const token = `jwt-token-for-${admin.admin_id}`; 

            // 3. Optional: Update last_login timestamp
            await query("UPDATE systemadmin SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1", [admin.admin_id]);

            return res.json({
                success: true,
                message: 'Login successful.',
                token,
                admin: authenticatedAdmin
            });
        }

        // Failure: Password did not match
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    } catch (error) {
        console.error("System Admin Login Error:", error);
        res.status(500).json({ success: false, message: 'Server failed to process login request.' });
    }
});


module.exports = router;