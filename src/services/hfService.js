import axios from "axios";

export const generateCaption = async (prompt) => {
  try {
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "phi3",
        prompt: `Write a short catchy social media caption (max 2 lines, include 2 hashtags): ${prompt}`,
        stream: false
      }
    );

    // Clean response
    const cleanedCaption = response.data.response
      .replace(/---+/g, "")      // remove dashed lines
      .replace(/\n{3,}/g, "\n\n") // remove extra blank lines
      .trim();

    return cleanedCaption;

  } catch (error) {
    console.error("Ollama Error:", error.message);
    throw new Error("Caption generation failed");
  }
};