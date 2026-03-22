import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResumeAgentUIMessage } from "@repo/core/agent";
import type { DocumentType } from "../resources/agent";
import { NotFoundError } from "../error";
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
  /**
   * When true, a missing session (404) triggers create with the URL `sessionId`
   * (OpenCode-style: client generates id, navigates, then provisions).
   * Use only for `general` dashboard agent — not for resume/cover-letter editors.
   */
  provisionIfNotFound?: boolean;
};

export type UseAgentSessionResult = {
  session: AgentSessionState | null;
  error: string | null;
  isLoadingSession: boolean;
  createSession: (opts?: { id?: string }) => Promise<AgentSessionState>;
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
  provisionIfNotFound = false,
}: UseAgentSessionOptions): UseAgentSessionResult {
  const api = useApi();
  const queryClient = useQueryClient();
  /**
   * After first-send createSession while still on a URL without `sessionId`, the session query is
   * disabled — merge this in so useAgentChat can attach transport and flush pendingMessage before
   * navigation completes.
   */
  const [pendingProvisioned, setPendingProvisioned] = useState<AgentSessionState | null>(null);
  const prevSessionIdRef = useRef<string | null | undefined>(sessionId ?? undefined);

  const getChatApiUrl = useCallback(
    (sessionId: string) => api.agent.getChatApiUrl(sessionId),
    [api],
  );

  const createSession = useCallback(
    async (opts?: { id?: string }): Promise<AgentSessionState> => {
      const res = await api.agent.createSession({
        documentType,
        documentId,
        ...(opts?.id ? { id: opts.id } : {}),
      });
      const s: AgentSessionState = {
        id: res.data.id,
        messages: res.data.messages ?? [],
      };
      queryClient.setQueryData(getAgentSessionQueryKey(s.id), s);
      setPendingProvisioned(s);
      onSessionIdChange?.(s.id);
      if (documentType === "general") {
        void queryClient.invalidateQueries({ queryKey: ["agent-sessions-list"] });
      }
      return s;
    },
    [api, documentId, documentType, onSessionIdChange, queryClient],
  );

  useEffect(() => {
    const prev = prevSessionIdRef.current;
    prevSessionIdRef.current = sessionId ?? undefined;
    if (prev && !sessionId) {
      setPendingProvisioned(null);
    }
  }, [sessionId]);

  const sessionQuery = useQuery({
    queryKey: sessionId ? getAgentSessionQueryKey(sessionId) : ["agent-session", "idle"],
    enabled: Boolean(sessionId) && !startNewSession,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    initialData:
      sessionId && !startNewSession
        ? (queryClient.getQueryData<AgentSessionState>(
            getAgentSessionQueryKey(sessionId),
          ) ?? undefined)
        : undefined,
    queryFn: async (): Promise<AgentSessionState> => {
      try {
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
      } catch (err) {
        if (
          provisionIfNotFound &&
          err instanceof NotFoundError &&
          Boolean(sessionId?.trim())
        ) {
          return createSession({ id: sessionId! });
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    if (
      pendingProvisioned &&
      sessionQuery.data?.id === pendingProvisioned.id
    ) {
      setPendingProvisioned(null);
    }
  }, [pendingProvisioned, sessionQuery.data]);

  return {
    session: startNewSession
      ? null
      : (sessionQuery.data ?? pendingProvisioned ?? null),
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
