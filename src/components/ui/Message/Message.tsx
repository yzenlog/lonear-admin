import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, LoaderCircle, X, XCircle } from "lucide-react";
import "./Message.css";

export type MessageType = "success" | "info" | "warning" | "error" | "loading";

export type MessageOptions = {
  type?: MessageType;
  content: ReactNode;
  duration?: number;
  closable?: boolean;
};

export type MessageApi = {
  open: (options: MessageOptions) => string;
  success: (content: ReactNode, options?: Omit<MessageOptions, "content" | "type">) => string;
  info: (content: ReactNode, options?: Omit<MessageOptions, "content" | "type">) => string;
  warning: (content: ReactNode, options?: Omit<MessageOptions, "content" | "type">) => string;
  error: (content: ReactNode, options?: Omit<MessageOptions, "content" | "type">) => string;
  loading: (content: ReactNode, options?: Omit<MessageOptions, "content" | "type">) => string;
  destroy: (id?: string) => void;
};

type InternalMessage = Required<Pick<MessageOptions, "type" | "duration" | "closable">> & {
  id: string;
  content: ReactNode;
  phase: "open" | "closing" | "collapsing";
};

const MessageContext = createContext<MessageApi | null>(null);
const MESSAGE_EXIT_DURATION = 160;
const MESSAGE_COLLAPSE_DURATION = 160;
const MESSAGE_MAX_COUNT = 4;

function getMessageDefaults(type: MessageType, duration?: number, closable?: boolean) {
  return {
    duration: duration ?? (type === "loading" ? 0 : 3000),
    closable: closable ?? type === "loading",
  };
}

function createMessageId() {
  return `message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function MessageIcon({ type }: { type: MessageType }) {
  if (type === "success") {
    return <CheckCircle2 size={17} strokeWidth={2.2} />;
  }

  if (type === "warning") {
    return <AlertTriangle size={17} strokeWidth={2.2} />;
  }

  if (type === "error") {
    return <XCircle size={17} strokeWidth={2.2} />;
  }

  if (type === "loading") {
    return <LoaderCircle className="ui-message-spinner" size={17} strokeWidth={2.2} />;
  }

  return <Info size={17} strokeWidth={2.2} />;
}

function MessageItem({ message, onClose }: { message: InternalMessage; onClose: (id: string) => void }) {
  useEffect(() => {
    if (message.duration <= 0 || message.phase !== "open") {
      return undefined;
    }

    const timer = window.setTimeout(() => onClose(message.id), message.duration);
    return () => window.clearTimeout(timer);
  }, [message.duration, message.id, message.phase, onClose]);

  return (
    <div
      className={[
        "ui-message",
        `ui-message-${message.type}`,
        message.phase === "closing" ? "is-closing" : "",
        message.phase === "collapsing" ? "is-collapsing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-hidden={message.phase !== "open" ? true : undefined}
    >
      <span className="ui-message-icon" aria-hidden="true">
        <MessageIcon type={message.type} />
      </span>
      <span className="ui-message-content">{message.content}</span>
      {message.closable ? (
        <button className="ui-message-close" type="button" aria-label="关闭提示" onClick={() => onClose(message.id)}>
          <X size={14} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const transitionTimersRef = useRef<Record<string, number[]>>({});

  const scheduleMessageRemoval = useCallback((messageId: string) => {
    if (transitionTimersRef.current[messageId]) {
      return;
    }

    const collapseTimer = window.setTimeout(() => {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId && message.phase === "closing" ? { ...message, phase: "collapsing" } : message,
        ),
      );
    }, MESSAGE_EXIT_DURATION);
    const removeTimer = window.setTimeout(() => {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));
      delete transitionTimersRef.current[messageId];
    }, MESSAGE_EXIT_DURATION + MESSAGE_COLLAPSE_DURATION);

    transitionTimersRef.current[messageId] = [collapseTimer, removeTimer];
  }, []);

  const destroy = useCallback((id?: string) => {
    setMessages((currentMessages) => {
      const closingIds = id ? [id] : currentMessages.map((message) => message.id);

      closingIds.forEach(scheduleMessageRemoval);

      return currentMessages.map((message) =>
        closingIds.includes(message.id) && message.phase === "open" ? { ...message, phase: "closing" } : message,
      );
    });
  }, [scheduleMessageRemoval]);

  useEffect(
    () => () => {
      Object.values(transitionTimersRef.current).forEach((timers) =>
        timers.forEach((timer) => window.clearTimeout(timer)),
      );
      transitionTimersRef.current = {};
    },
    [],
  );

  const open = useCallback((options: MessageOptions) => {
    const type = options.type ?? "info";
    const defaults = getMessageDefaults(type, options.duration, options.closable);
    const id = createMessageId();

    setMessages((currentMessages) => {
      const activeMessages = currentMessages.filter((message) => message.phase === "open");
      const overflowCount = Math.max(0, activeMessages.length + 1 - MESSAGE_MAX_COUNT);
      const overflowIds = activeMessages.slice(0, overflowCount).map((message) => message.id);

      overflowIds.forEach(scheduleMessageRemoval);

      return [
        ...currentMessages.map((message) =>
          overflowIds.includes(message.id) ? { ...message, phase: "closing" as const } : message,
        ),
        {
          id,
          type,
          content: options.content,
          duration: defaults.duration,
          closable: defaults.closable,
          phase: "open",
        },
      ];
    });

    return id;
  }, [scheduleMessageRemoval]);

  const api = useMemo<MessageApi>(
    () => ({
      open,
      success: (content, options) => open({ ...options, content, type: "success" }),
      info: (content, options) => open({ ...options, content, type: "info" }),
      warning: (content, options) => open({ ...options, content, type: "warning" }),
      error: (content, options) => open({ ...options, content, type: "error" }),
      loading: (content, options) => open({ ...options, content, type: "loading" }),
      destroy,
    }),
    [destroy, open],
  );

  return (
    <MessageContext.Provider value={api}>
      {children}
      <div className="ui-message-viewport" aria-label="全局提示">
        {messages.map((message) => (
          <MessageItem message={message} onClose={destroy} key={message.id} />
        ))}
      </div>
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const api = useContext(MessageContext);

  if (!api) {
    throw new Error("useMessage must be used within MessageProvider");
  }

  return api;
}
