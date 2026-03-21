import { useCallback, useEffect, useMemo, useState } from "react";
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
  });
  const [pendingMessage, setPendingMessage] = useState<{
    id: string;
    text: string;
  } | null>(null);

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

  const chat = useChat({
    id: session?.id ?? "agent-pending",
    messages: (session?.messages ?? []) as ResumeAgentUIMessage[],
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

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
