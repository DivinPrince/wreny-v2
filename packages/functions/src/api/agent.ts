import { createAgentUIStreamResponse } from "ai";
import { resumeAgent } from "@repo/core/agent";
import type { ResumeAgentUIMessage } from "@repo/core/agent";
import { Hono } from "hono";

import { type AppEnv, requireAuth } from "./common";

export const agentApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .post("/chat", async (c) => {
    const body = (await c.req.json()) as {
      messages?: ResumeAgentUIMessage[];
      documentType?: "resume" | "coverLetter";
      resumeId?: string;
      coverLetterId?: string;
    };
    const user = c.get("user")!;
    const activeDocumentType = body.documentType ?? (body.coverLetterId ? "coverLetter" : "resume");
    const activeDocumentId =
      activeDocumentType === "coverLetter" ? (body.coverLetterId ?? "") : (body.resumeId ?? "");

    const systemContent = `Current user context: userId="${user.id}", name="${user.name}", email="${user.email}". The active document type is "${activeDocumentType}" and the active document ID is "${activeDocumentId}". This is an active ${activeDocumentType === "coverLetter" ? "cover letter" : "resume"} editing session, so unless the user clearly changes topics, assume their requests and follow-up questions refer to this document. Do not ask generic intake questions about whether they want to update a resume, refine a cover letter, or tailor documents when an active document is present. If the active document type is "resume", use this document ID when calling getResume and when proposing changes set documentType to "resume" and documentId to this active document ID. If the active document type is "coverLetter", use this document ID when calling getCoverLetter and when proposing changes set documentType to "coverLetter" and documentId to this active document ID. Use this userId when calling getUserProfile or any tool that needs the current user's ID.`;

    const messagesWithContext: ResumeAgentUIMessage[] = [
      {
        id: crypto.randomUUID(),
        role: "system" as const,
        parts: [{ type: "text" as const, text: systemContent }],
      },
      ...(body.messages ?? []),
    ];

    return createAgentUIStreamResponse({
      agent: resumeAgent,
      uiMessages: messagesWithContext,
    });
  });
