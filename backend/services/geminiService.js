const axios = require("axios");

const GEMINI_MODEL = "gemini-2.5-flash";

async function askGemini(question, retries = 2) {
  try {

    const prompt = `
You are a professional tutor for the GATE (Graduate Aptitude Test in Engineering).

Explain concepts in a way that helps students prepare for the GATE exam.

Rules:
- Keep explanations clear
- Include formulas if needed
- Give small examples
- Avoid unnecessary long text

Question:
${question}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const answer =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return answer;

  } catch (error) {

    console.error("Gemini Error:", error.response?.data || error.message);

    if (retries > 0 && error.response?.status === 429) {
      console.warn("Gemini busy, retrying...");
      await new Promise((res) => setTimeout(res, 1500));
      return askGemini(question, retries - 1);
    }

    throw error;
  }
}

module.exports = { askGemini };