/**
 * AI-powered project identity generation
 *
 * Generates emoji, title, and color scheme for projects based on their path/name
 */

import { getAIClient, getAIModel } from "./client.js";
import { extractOutputText, formatErrorSnippet, withRetry } from "./utils.js";

export interface ProjectIdentity {
  emoji: string;
  title: string;
  gradientStart: string;
  gradientEnd: string;
}

/**
 * Generate a visual identity for a project based on its path or name.
 * Returns emoji, formatted title, and gradient colors.
 *
 * @param pathOrName - Project path or name to analyze
 * @returns ProjectIdentity or null if AI is unavailable
 */
export async function generateProjectIdentity(pathOrName: string): Promise<ProjectIdentity | null> {
  const client = getAIClient();
  if (!client) return null;

  const model = getAIModel();

  const callModel = async (): Promise<ProjectIdentity> => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You create visual identities for software projects. Given a project path or name:
1. Choose a representative emoji that reflects the project's likely purpose
2. Convert the folder name to a readable Title Case format (remove hyphens/underscores, capitalize words)
3. Pick two bright/neon/pastel gradient colors that work well together for a dark theme UI

Guidelines:
- Emoji should match the tech stack or purpose (e.g., React/web, CLI tool, mobile app, AI/ML, backend, etc.)
- Title should be clean and readable (e.g., "canopy-app" -> "Canopy App")
- Colors should be vibrant but not harsh. Good examples: #00D4FF, #FF6B6B, #4ADE80, #FBBF24, #A855F7
- Avoid dark colors like #000, #333, etc.

Respond with JSON:
{"emoji": "...", "title": "...", "gradientStart": "#hex", "gradientEnd": "#hex"}`,
        },
        {
          role: "user",
          content: `Project path: "${pathOrName}"`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 128,
    });

    const text = extractOutputText(response);
    if (!text) {
      throw new Error(`Identity: empty response from model. Raw: ${formatErrorSnippet(response)}`);
    }

    try {
      const parsed = JSON.parse(text) as ProjectIdentity;

      // Validate required fields
      if (!parsed.emoji || typeof parsed.emoji !== "string") {
        throw new Error("Missing or invalid emoji field");
      }
      if (!parsed.title || typeof parsed.title !== "string") {
        throw new Error("Missing or invalid title field");
      }
      if (!parsed.gradientStart || typeof parsed.gradientStart !== "string") {
        throw new Error("Missing or invalid gradientStart field");
      }
      if (!parsed.gradientEnd || typeof parsed.gradientEnd !== "string") {
        throw new Error("Missing or invalid gradientEnd field");
      }

      return parsed;
    } catch (parseError) {
      throw new Error(`Identity: failed to parse JSON. Raw: ${formatErrorSnippet(text)}`);
    }
  };

  try {
    return await withRetry(callModel, {
      maxRetries: 2,
      baseDelay: 300,
      shouldRetry: () => true,
    });
  } catch (error) {
    console.error("[AI] generateProjectIdentity failed:", error);
    return null;
  }
}

/**
 * Generate identity and return a simplified version for the Project model
 */
export async function generateProjectNameAndEmoji(
  projectPath: string
): Promise<{ name: string; emoji: string; color?: string } | null> {
  const identity = await generateProjectIdentity(projectPath);
  if (!identity) return null;

  return {
    name: identity.title,
    emoji: identity.emoji,
    color: identity.gradientStart, // Use start color as primary
  };
}
