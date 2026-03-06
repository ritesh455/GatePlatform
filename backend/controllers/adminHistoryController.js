const db = require("../config/database");

/*
GET TEST HISTORY (ADMIN BRANCH BASED)
*/
const getTestHistory = async (req, res) => {
  try {

    const adminBranch = req.user.branch;

    const result = await db.query(
      `
      SELECT 
        mt.id as test_id,
        mt.title as test_title,
        COUNT(tr.id) as attempt_count
      FROM mock_tests mt
      LEFT JOIN test_results tr 
        ON mt.id = tr.test_id
      LEFT JOIN student s
        ON tr.student_user_no = s.user_no
      WHERE s.branch = $1
      GROUP BY mt.id
      ORDER BY mt.created_at DESC
      `,
      [adminBranch]
    );

    res.json({
      success: true,
      tests: result.rows
    });

  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch test history"
    });
  }
};



/*
GET STUDENTS WHO ATTEMPTED PARTICULAR TEST
*/
const getTestAttempts = async (req, res) => {
  try {

    const { testId } = req.params;
    const adminBranch = req.user.branch;

    const result = await db.query(
      `
      SELECT
        s.email,
        s.city,
        s.state,
        tr.score,
        tr.total_questions,
        tr.completed_at
      FROM test_results tr
      JOIN student s
        ON s.user_no = tr.student_user_no
      WHERE tr.test_id = $1::uuid
      AND s.branch = $2
      ORDER BY tr.completed_at DESC
      `,
      [testId, adminBranch]
    );

    res.json({
      success: true,
      attempts: result.rows
    });

  } catch (error) {

    console.error("Attempt fetch error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getTestHistory,
  getTestAttempts
};