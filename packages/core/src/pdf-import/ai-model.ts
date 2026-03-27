import { createGoogleGenerativeAI } from "@ai-sdk/google";

/** Gemini model used for resume PDF extract, LinkedIn scrape, and LinkedIn AI polish. */
export function getResumeAiModel() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_VERTEX_API_KEY ||
    "";
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_VERTEX_API_KEY)");
  }
  const google = createGoogleGenerativeAI({ apiKey });
  return google("gemini-2.5-flash");
}
