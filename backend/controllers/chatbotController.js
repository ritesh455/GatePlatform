const { askGemini } = require("../services/geminiService");

const askGateChatbot = async (req, res) => {
  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required"
      });
    }

    const answer = await askGemini(question);

    res.json({
      success: true,
      answer
    });

  } catch (error) {

    console.error("Chatbot error:", error);

    res.status(500).json({
      success: false,
      message: "AI service failed"
    });
  }
};

module.exports = { askGateChatbot };