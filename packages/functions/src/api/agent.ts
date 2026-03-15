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
      resumeId?: string;
    };
    const user = c.get("user")!;

    const systemContent = `Current user context: userId="${user.id}", name="${user.name}", email="${user.email}". The resume the user is currently editing has ID="${body.resumeId ?? ""}". This is an active resume editing session, so unless the user clearly changes topics, assume their requests and follow-up questions refer to this resume. Do not ask generic intake questions about whether they want to update a resume, refine a cover letter, or tailor documents when this resumeId is present. Use this resumeId when calling getResume, and use this userId when calling getUserProfile or any tool that needs the current user's ID.`;

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
