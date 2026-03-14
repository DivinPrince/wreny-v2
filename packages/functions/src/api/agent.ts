import { createAgentUIStreamResponse } from "ai";
import { resumeAgent } from "@repo/core/agent";
import { Hono } from "hono";

import { type AppEnv, requireAuth } from "./common";

export const agentApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  .post("/chat", async (c) => {
    const { messages, resumeId } = await c.req.json();
    const user = c.get("user")!;

    const messagesWithContext = [
      {
        role: "system" as const,
        content: `Current user context: userId="${user.id}", name="${user.name}", email="${user.email}". The resume the user is currently editing has ID="${resumeId}". Use this resumeId when calling getResume, and use this userId when calling getUserProfile or any tool that needs the current user's ID.`,
      },
      ...messages,
    ];

    return createAgentUIStreamResponse({
      agent: resumeAgent,
      uiMessages: messagesWithContext,
    });
  });
