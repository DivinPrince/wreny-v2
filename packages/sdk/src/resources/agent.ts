import type { ResumeAgentUIMessage } from "@repo/core/agent";
import { APIResource } from "../core";
import type { RequestOptions, Response } from "../types";

export type DocumentType = "resume" | "coverLetter" | "general";

export type AgentSessionInfo = {
  id: string;
  documentType: DocumentType;
  documentId: string;
  createdAt?: string;
  /** First user message preview for session lists */
  preview?: string | null;
};

export type AgentSession = AgentSessionInfo & {
  messages: ResumeAgentUIMessage[];
};

export class AgentResource extends APIResource {
  private get basePath(): string {
    return "/api/agent";
  }

  /**
   * List sessions for a document
   */
  listSessions(
    params: { documentType: DocumentType; documentId: string },
    options?: RequestOptions,
  ): Promise<Response<AgentSessionInfo[]>> {
    return this._client.get(`${this.basePath}/sessions`, {
      ...options,
      query: {
        documentType: params.documentType,
        documentId: params.documentId,
      },
    });
  }

  /**
   * Create a new session for a document
   */
  createSession(
    params: { documentType?: DocumentType; documentId: string; id?: string },
    options?: RequestOptions,
  ): Promise<Response<AgentSession>> {
    return this._client.post(`${this.basePath}/sessions`, {
      ...options,
      body: {
        documentType: params.documentType ?? "resume",
        documentId: params.documentId,
        ...(params.id ? { id: params.id } : {}),
      },
    });
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string, options?: RequestOptions): Promise<Response<AgentSession>> {
    return this._client.get(`${this.basePath}/sessions/${sessionId}`, options);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string, options?: RequestOptions): Promise<Response<boolean>> {
    return this._client.delete(`${this.basePath}/sessions/${sessionId}`, options);
  }

  /**
   * Get messages for a session
   */
  getMessages(
    sessionId: string,
    options?: RequestOptions,
  ): Promise<Response<ResumeAgentUIMessage[]>> {
    return this._client.get(`${this.basePath}/sessions/${sessionId}/message`, options);
  }

  /**
   * URL for the streaming chat endpoint (POST). Used by useChat transport.
   */
  getChatApiUrl(sessionId: string): string {
    const base = this._client.baseURL.replace(/\/$/, "");
    return `${base}${this.basePath}/sessions/${sessionId}/message`;
  }
}
