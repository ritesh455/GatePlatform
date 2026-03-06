const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");

const {
  getTestHistory,
  getTestAttempts
} = require("../controllers/adminHistoryController");


// Get all tests history
router.get(
  "/test-history",
  authenticateToken,
  getTestHistory
);


// Get students who attempted test
router.get(
  "/test-history/:testId",
  authenticateToken,
  getTestAttempts
);

module.exports = router;