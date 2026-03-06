const express = require("express");
const router = express.Router();

const { askGateChatbot } = require("../controllers/chatbotController");

router.post("/ask", askGateChatbot);

module.exports = router;