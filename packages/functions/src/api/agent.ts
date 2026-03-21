import { createAgentUIStreamResponse, validateUIMessages } from "ai";
import {
  resumeAgent,
  SessionsService,
  type ResumeAgentUIMessage,
} from "@repo/core/agent";
import { Hono } from "hono";

import { ErrorCodes, VisibleError } from "@repo/core/error";
import { type AppEnv, ok, requireAuth } from "./common";

const documentTypeToDb = (
  t: "resume" | "coverLetter",
): "resume" | "cover_letter" =>
  t === "coverLetter" ? "cover_letter" : "resume";
const documentTypeToApi = (
  t: "resume" | "cover_letter",
): "resume" | "coverLetter" =>
  t === "cover_letter" ? "coverLetter" : "resume";

export const agentApi = new Hono<AppEnv>()
  .use("*", requireAuth)
  // Collection: list and create (OpenCode pattern: GET /, POST /)
  .get("/sessions", async (c) => {
    const user = c.get("user")!;
    const documentType = c.req.query("documentType") as
      | "resume"
      | "coverLetter"
      | undefined;
    const documentId = c.req.query("documentId");
    if (!documentType || !documentId) {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_PARAMETER,
        "documentType and documentId query params are required",
      );
    }
    const sessions = await SessionsService.listByDocument({
      userId: user.id,
      documentType: documentTypeToDb(documentType),
      documentId,
    });
    return ok(
      c,
      sessions.map((s) => ({
        id: s.id,
        documentType: documentTypeToApi(s.documentType),
        documentId: s.documentId,
        createdAt: s.createdAt,
      })),
    );
  })
  .post("/sessions", async (c) => {
    const user = c.get("user")!;
    const body = (await c.req.json()) as {
      documentType?: "resume" | "coverLetter";
      documentId?: string;
    };
    const documentType = body.documentType ?? "resume";
    const documentId = body.documentId ?? "";
    if (!documentId) {
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_PARAMETER,
        "documentId is required",
      );
    }
    const session = await SessionsService.create({
      userId: user.id,
      documentType: documentTypeToDb(documentType),
      documentId,
    });
    return ok(c, {
      id: session.id,
      documentType: documentTypeToApi(session.documentType),
      documentId: session.documentId,
      messages: session.messages,
    }, 201);
  })
  // Resource: get, update, delete (OpenCode: GET /:sessionID, PATCH /:sessionID, DELETE /:sessionID)
  .get("/sessions/:sessionID", async (c) => {
    const user = c.get("user")!;
    const sessionID = c.req.param("sessionID");
    const session = await SessionsService.byId(sessionID);
    if (!session || session.userId !== user.id) {
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Session not found",
      );
    }
    return ok(c, {
      id: session.id,
      documentType: documentTypeToApi(session.documentType),
      documentId: session.documentId,
      messages: session.messages,
    });
  })
  .delete("/sessions/:sessionID", async (c) => {
    const user = c.get("user")!;
    const sessionID = c.req.param("sessionID");
    const session = await SessionsService.byId(sessionID);
    if (!session || session.userId !== user.id) {
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Session not found",
      );
    }
    await SessionsService.remove(sessionID);
    return ok(c, true);
  })
  // Messages sub-resource (OpenCode: GET /:sessionID/message, POST /:sessionID/message)
  .get("/sessions/:sessionID/message", async (c) => {
    const user = c.get("user")!;
    const sessionID = c.req.param("sessionID");
    const session = await SessionsService.byId(sessionID);
    if (!session || session.userId !== user.id) {
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Session not found",
      );
    }
    return ok(c, session.messages);
  })
  .put("/sessions/:sessionID/message", async (c) => {
    const user = c.get("user")!;
    const sessionID = c.req.param("sessionID");
    const body = (await c.req.json()) as { messages?: ResumeAgentUIMessage[] };
    const session = await SessionsService.byId(sessionID);
    if (!session || session.userId !== user.id) {
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Session not found",
      );
    }
    const messages = body.messages ?? [];
    const toStore = messages.filter((m) => m.role !== "system");
    await SessionsService.updateMessages({ id: sessionID, messages: toStore });
    return ok(c, true);
  })
  // Send message (OpenCode pattern: POST /:sessionID/message)
  .post("/sessions/:sessionID/message", async (c) => {
    const body = (await c.req.json()) as {
      messages?: ResumeAgentUIMessage[];
    };
    const user = c.get("user")!;
    const sessionID = c.req.param("sessionID");
    const session = await SessionsService.byId(sessionID);
    if (!session || session.userId !== user.id) {
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Session not found",
      );
    }
    const activeDocumentType =
      session.documentType === "cover_letter" ? "coverLetter" : "resume";
    const activeDocumentId = session.documentId;

    const systemContent = `Current user context: userId="${user.id}", name="${user.name}", email="${user.email}". The active document type is "${activeDocumentType}" and the active document ID is "${activeDocumentId}". This is an active ${activeDocumentType === "coverLetter" ? "cover letter" : "resume"} editing session, so unless the user clearly changes topics, assume their requests and follow-up questions refer to this document. Do not ask generic intake questions about whether they want to update a resume, refine a cover letter, or tailor documents when an active document is present. If the active document type is "resume", use this document ID when calling getResume and when proposing changes set documentType to "resume" and documentId to this active document ID. If the active document type is "coverLetter", use this document ID when calling getCoverLetter and when proposing changes set documentType to "coverLetter" and documentId to this active document ID. Use this userId when calling getUserProfile or any tool that needs the current user's ID.`;

    let messages: ResumeAgentUIMessage[] = (body.messages ??
      session.messages) as ResumeAgentUIMessage[];
    try {
      messages = (await validateUIMessages({
        messages,
        tools: resumeAgent.tools as Parameters<typeof validateUIMessages>[0]["tools"],
      })) as ResumeAgentUIMessage[];
    } catch {
      messages = [];
    }

    const messagesWithContext: ResumeAgentUIMessage[] = [
      {
        id: crypto.randomUUID(),
        role: "system" as const,
        parts: [{ type: "text" as const, text: systemContent }],
      },
      ...messages,
    ];

    return createAgentUIStreamResponse({
      agent: resumeAgent,
      uiMessages: messagesWithContext,
      onFinish: async ({ messages, isAborted }) => {
        if (isAborted) return;
        const toStore = messages.filter((m) => m.role !== "system");
        await SessionsService.updateMessages({
          id: sessionID,
          messages: toStore as ResumeAgentUIMessage[],
        });
      },
    });
  });
