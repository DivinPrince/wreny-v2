import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import type { ResumeAgentUIMessage } from "@repo/core/agent";
import type { DocumentType } from "../resources/agent";
import {
  getAgentSessionQueryKey,
  useAgentSession,
} from "./use-agent-session";

export type UseAgentChatOptions = {
  documentType: DocumentType;
  documentId: string;
  sessionId?: string | null;
  startNewSession?: boolean;
  onSessionIdChange?: (sessionId: string) => void;
};

/**
 * Custom AI chat hook that wraps useChat and handles:
 * - Auto-creation of session on first send (OpenCode style)
 * - Background loading of existing session (no blocking)
 * - Streaming responses via AI SDK
 *
 * Use with ApiProvider. No need to import api or manage session manually.
 */
export function useAgentChat({
  documentType,
  documentId,
  sessionId,
  startNewSession = false,
  onSessionIdChange,
}: UseAgentChatOptions) {
  const queryClient = useQueryClient();
  const {
    session,
    error,
    isLoadingSession,
    createSession,
    getChatApiUrl,
  } = useAgentSession({
    documentType,
    documentId,
    sessionId,
    startNewSession,
    onSessionIdChange,
    provisionIfNotFound: documentType === "general",
  });
  const [pendingMessage, setPendingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const prevSessionIdRef = useRef<string | null | undefined>(undefined);

  const transport = useMemo(() => {
    const apiUrl = session
      ? getChatApiUrl(session.id)
      : "/api/agent/sessions/pending/message";
    return new DefaultChatTransport({
      api: apiUrl,
      credentials: "include",
      prepareSendMessagesRequest: ({
        body,
        messageId,
        messages,
        trigger,
      }) => ({
        body: {
          ...body,
          messages,
          trigger,
          messageId,
        },
      }),
    });
  }, [session?.id, getChatApiUrl]);

  /** Stable while URL/session refer to the same conversation; avoids id flip agent-pending → real id wiping sync. */
  const chatId =
    sessionId?.trim() || session?.id || "agent-pending";

  const chat = useChat({
    id: chatId,
    messages: (session?.messages ?? []) as ResumeAgentUIMessage[],
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  /**
   * When navigating to /agent/:sessionId, useChat often keeps the same id before/after load, so the Chat
   * instance is not recreated and stays empty. Hydrate from the loaded session once.
   */
  const sessionHydrationKey = session
    ? `${session.id}:${(session.messages ?? []).length}:${(session.messages ?? []).at(-1)?.id ?? ""}`
    : "";

  useEffect(() => {
    if (!session) return;
    const sm = (session.messages ?? []) as ResumeAgentUIMessage[];
    if (sm.length === 0) return;
    chat.setMessages((prev) => (prev.length === 0 ? sm : prev));
  }, [session, sessionHydrationKey, chat.setMessages]);

  /** New chat: URL dropped `sessionId` — clear local thread (e.g. /dashboard/agent from /dashboard/agent/:id). */
  useEffect(() => {
    const sid = sessionId?.trim() || null;
    if (prevSessionIdRef.current === undefined) {
      prevSessionIdRef.current = sid;
      return;
    }
    const prev = prevSessionIdRef.current;
    prevSessionIdRef.current = sid;
    if (prev && !sid) {
      chat.setMessages([]);
      setPendingMessage(null);
    }
  }, [sessionId, chat.setMessages]);

  // Send pending message when session becomes available
  useEffect(() => {
    if (!session || !pendingMessage) return;
    chat.sendMessage({ text: pendingMessage.text });
  }, [session?.id, pendingMessage, chat.sendMessage]);

  useEffect(() => {
    if (!pendingMessage) return;

    const hasConfirmedMessage = chat.messages.some((message) => {
      if (message.role !== "user") return false;
      return message.parts.some(
        (part) => part.type === "text" && "text" in part && part.text === pendingMessage.text,
      );
    });

    if (hasConfirmedMessage) {
      setPendingMessage(null);
    }
  }, [chat.messages, pendingMessage]);

  useEffect(() => {
    if (!session) return;
    queryClient.setQueryData(getAgentSessionQueryKey(session.id), {
      id: session.id,
      messages: chat.messages as ResumeAgentUIMessage[],
    });
  }, [chat.messages, queryClient, session]);

  const sendMessage = useCallback(
    (content: { text: string }) => {
      if (session) {
        chat.sendMessage(content);
      } else if (isLoadingSession) {
        return;
      } else {
        const optimisticMessage = {
          id: `pending-${Date.now()}`,
          text: content.text,
        };
        setPendingMessage(optimisticMessage);
        createSession().catch(() => {
          setPendingMessage(null);
        });
      }
    },
    [session, isLoadingSession, chat.sendMessage, createSession],
  );

  const optimisticMessages = pendingMessage
    ? ([
        {
          id: pendingMessage.id,
          role: "user",
          parts: [{ type: "text", text: pendingMessage.text }],
        },
      ] as ResumeAgentUIMessage[])
    : [];
  const hasConfirmedPendingMessage =
    !!pendingMessage &&
    chat.messages.some((message) => {
      if (message.role !== "user") return false;
      return message.parts.some(
        (part) => part.type === "text" && "text" in part && part.text === pendingMessage.text,
      );
    });

  const messages = session
    ? pendingMessage && !hasConfirmedPendingMessage
      ? ([...optimisticMessages, ...chat.messages] as ResumeAgentUIMessage[])
      : (chat.messages as ResumeAgentUIMessage[])
    : optimisticMessages;

  return {
    /** Current session (null if none loaded/created yet) */
    session,
    /** Error from load or create */
    error,
    /** True when loading an existing session from storage or URL */
    isLoadingSession,
    /** True when no session yet - show composer, first send will create session */
    isNewSession:
      !isLoadingSession && !session && optimisticMessages.length === 0,
    /** Chat messages, including an optimistic first message before session creation finishes */
    messages,
    /** Unified send - creates session on first use, then sends */
    sendMessage,
    status: session ? chat.status : pendingMessage ? ("submitted" as const) : ("ready" as const),
    addToolApprovalResponse: chat.addToolApprovalResponse,
  };
}
