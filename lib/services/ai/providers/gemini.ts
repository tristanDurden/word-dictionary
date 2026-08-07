import { GoogleGenAI } from "@google/genai";

const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenAI | undefined;
};

export function getGemini(): GoogleGenAI {
  if (!globalForGemini.gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    globalForGemini.gemini = new GoogleGenAI({ apiKey });
  }
  return globalForGemini.gemini;
}
