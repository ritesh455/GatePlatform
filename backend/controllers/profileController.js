const db = require('../config/database');

const getUserProfile = async (req, res) => {
  try {

    const userId = req.user.id;
    const userType = req.user.userType;

    let query;

    if (userType === "student") {

      query = `
        SELECT id, email, user_no, branch, created_at
        FROM student
        WHERE id = $1
      `;

    } else {

      query = `
        SELECT id, email, role, branch, created_at
        FROM admins
        WHERE id = $1
      `;

    }

    const result = await db.query(query, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getUserProfile };