import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResumeAgentUIMessage } from "@repo/core/agent";
import type { DocumentType } from "../resources/agent";
import { useApi } from "./context";

export type AgentSessionState = {
  id: string;
  messages: ResumeAgentUIMessage[];
};

export function getAgentSessionQueryKey(sessionId: string) {
  return ["agent-session", sessionId] as const;
}

export type UseAgentSessionOptions = {
  documentType: DocumentType;
  documentId: string;
  sessionId?: string | null;
  startNewSession?: boolean;
  onSessionIdChange?: (sessionId: string) => void;
};

export type UseAgentSessionResult = {
  session: AgentSessionState | null;
  error: string | null;
  isLoadingSession: boolean;
  createSession: () => Promise<AgentSessionState>;
  getChatApiUrl: (sessionId: string) => string;
};

/**
 * Manages agent session lifecycle for a document. Loads existing session in background,
 * provides createSession for first-send flow (OpenCode style). No blocking loading state.
 */
export function useAgentSession({
  documentType,
  documentId,
  sessionId,
  startNewSession = false,
  onSessionIdChange,
}: UseAgentSessionOptions): UseAgentSessionResult {
  const api = useApi();
  const queryClient = useQueryClient();

  const getChatApiUrl = useCallback(
    (sessionId: string) => api.agent.getChatApiUrl(sessionId),
    [api],
  );

  const sessionQuery = useQuery({
    queryKey: sessionId ? getAgentSessionQueryKey(sessionId) : ["agent-session", "idle"],
    enabled: Boolean(sessionId) && !startNewSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<AgentSessionState> => {
      const res = await api.agent.getSession(sessionId!);
      if (
        res.data.documentType !== documentType ||
        res.data.documentId !== documentId
      ) {
        throw new Error("The selected chat does not belong to this document");
      }

      return {
        id: res.data.id,
        messages: res.data.messages ?? [],
      };
    },
  });

  const createSession = useCallback(async (): Promise<AgentSessionState> => {
    try {
      const res = await api.agent.createSession({
        documentType,
        documentId,
      });
      const s: AgentSessionState = {
        id: res.data.id,
        messages: res.data.messages ?? [],
      };
      queryClient.setQueryData(getAgentSessionQueryKey(s.id), s);
      onSessionIdChange?.(s.id);
      return s;
    } catch (err) {
      throw err;
    }
  }, [api, documentType, documentId, onSessionIdChange, queryClient]);

  return {
    session: startNewSession ? null : (sessionQuery.data ?? null),
    error: sessionQuery.error instanceof Error ? sessionQuery.error.message : null,
    isLoadingSession:
      !startNewSession &&
      Boolean(sessionId) &&
      sessionQuery.isPending &&
      !sessionQuery.data,
    createSession,
    getChatApiUrl,
  };
}
