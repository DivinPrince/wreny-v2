/**
 * Relevance Stack trigger: POST JSON `{ url }` with `Authorization: <YOUR_API_KEY>`.
 * URL is fixed; configure only `RELEVANCE_LINKEDIN_IMPORT_API_KEY` (SST: `RelevanceLinkedInImportApiKey`).
 */
const RELEVANCE_LINKEDIN_TRIGGER_URL =
  "https://api-d7b62b.stack.tryrelevance.com/latest/studios/b170eb17-e7cc-41e4-98f1-66327eca9d50/trigger_webhook?project=a252e11a-d4c2-4736-81df-18a3f2fccd60";

/** Relevance dashboard API key, sent verbatim as the `Authorization` header. */
export function getRelevanceLinkedInImportApiKey(): string {
  const v = process.env.RELEVANCE_LINKEDIN_IMPORT_API_KEY?.trim();
  return v && v !== "-" ? v : "";
}

export function isLinkedInProfileImportConfigured(): boolean {
  return getRelevanceLinkedInImportApiKey().length > 0;
}

function logLinkedInProfileImportError(
  phase: string,
  linkedinUrl: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = {
    scope: "linkedin-import",
    phase,
    linkedinUrl,
    ...extra,
  };
  if (err instanceof Error) {
    payload.errorKind = err.name;
    payload.message = err.message;
    payload.stack = err.stack;
  } else {
    payload.errorKind = "unknown";
    payload.message = String(err);
  }
  console.error("[linkedin-import]", JSON.stringify(payload));
}

function unwrapRelevanceImportBody(body: unknown): Record<string, unknown> {
  if (body == null) {
    throw new Error("Relevance returned null body");
  }
  if (Array.isArray(body)) {
    const first = body[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const row = first as Record<string, unknown>;
      const nested = row.data;
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        return nested as Record<string, unknown>;
      }
      return row;
    }
    throw new Error("Relevance returned an empty or invalid array");
  }
  if (typeof body === "object") {
    const o = body as Record<string, unknown>;
    const nested = o.data;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return o;
  }
  throw new Error("Relevance returned non-object JSON");
}

async function callRelevanceLinkedInTrigger(
  linkedinUrl: string,
  apiKey: string,
): Promise<Record<string, unknown>[]> {
  const url = linkedinUrl.trim();
  const res = await fetch(RELEVANCE_LINKEDIN_TRIGGER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ url }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Relevance LinkedIn import HTTP ${res.status}: ${text.slice(0, 1200)}`,
    );
  }
  if (!text.trim()) {
    throw new Error("Relevance LinkedIn import returned an empty body");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Relevance LinkedIn import returned non-JSON");
  }
  return [unwrapRelevanceImportBody(parsed)];
}

/** Calls Relevance trigger; returns one row for merge / LLM steps. */
export async function fetchLinkedInProfileImportItems(
  linkedinUrl: string,
): Promise<Record<string, unknown>[]> {
  const url = linkedinUrl.trim();
  const apiKey = getRelevanceLinkedInImportApiKey();
  if (!apiKey) {
    throw new Error(
      "LinkedIn import is not configured: set RELEVANCE_LINKEDIN_IMPORT_API_KEY (Relevance YOUR → Authorization)",
    );
  }
  try {
    return await callRelevanceLinkedInTrigger(url, apiKey);
  } catch (err) {
    logLinkedInProfileImportError("fetchLinkedInProfileImportItems", url, err);
    throw err;
  }
}
