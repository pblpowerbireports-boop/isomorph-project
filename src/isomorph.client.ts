import { createClient } from "@isomorph.ai/app-sdk";

// Single client for the whole app. Identity, data and files come from Isomorph;
// the same calls work locally (isomorph dev) and in preview/production.
export const isomorph = createClient();

// Call the SDK's namespaces on this client directly (isomorph.data.from, isomorph.files.*,
// isomorph.integrations.execute, isomorph.ai.chat). Rules: core.md in the isomorph skill;
// integrations.md and ai.md for company systems and AI.

export function errorCode(error: unknown): string {
  const details = (error as { details?: { code?: string } } | undefined)?.details;
  return typeof details?.code === "string" ? details.code : (error as { category?: string })?.category ?? "UNKNOWN";
}
