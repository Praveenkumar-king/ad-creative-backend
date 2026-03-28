import axios from "axios";

export const generateCaption = async (prompt) => {
  try {

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",   // ✅ FIXED MODEL
        messages: [
          {
            role: "user",
            content: `Write a short catchy social media caption (max 2 lines, include 2 hashtags): ${prompt}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content.trim();

  } catch (error) {

    console.error("GROQ ERROR:", error.response?.data || error.message);

    throw new Error("AI caption failed");

  }
};