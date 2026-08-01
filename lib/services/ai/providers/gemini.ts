import { GoogleGenAI } from "@google/genai";

const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenAI | undefined;
};

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

export const gemini =
  globalForGemini.gemini ?? createGeminiClient();

if (process.env.NODE_ENV !== "production") {
  globalForGemini.gemini = gemini;
}
