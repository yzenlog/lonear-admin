import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, X, XCircle } from "lucide-react";
import "./LonNotification.css";

export type LonNotificationType = "success" | "info" | "warning" | "error";
export type LonNotificationPlacement = "left" | "right";

export type LonNotificationOptions = {
  type?: LonNotificationType;
  title: ReactNode;
  description?: ReactNode;
  duration?: number;
  closable?: boolean;
  placement?: LonNotificationPlacement;
};

export type LonNotificationApi = {
  open: (options: LonNotificationOptions) => string;
  success: (options: Omit<LonNotificationOptions, "type">) => string;
  info: (options: Omit<LonNotificationOptions, "type">) => string;
  warning: (options: Omit<LonNotificationOptions, "type">) => string;
  error: (options: Omit<LonNotificationOptions, "type">) => string;
  destroy: (id?: string) => void;
};

type InternalNotification = Required<Pick<LonNotificationOptions, "type" | "duration" | "closable" | "placement">> & {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  phase: "open" | "closing" | "collapsing";
};

const NotificationContext = createContext<LonNotificationApi | null>(null);
const NOTIFICATION_EXIT_DURATION = 180;
const NOTIFICATION_COLLAPSE_DURATION = 180;
const NOTIFICATION_MAX_COUNT = 6;

function createNotificationId() {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getNotificationDefaults(
  duration?: number,
  closable?: boolean,
  placement?: LonNotificationPlacement,
) {
  return {
    duration: duration ?? 4500,
    closable: closable ?? true,
    placement: placement ?? "right",
  };
}

function NotificationIcon({ type }: { type: LonNotificationType }) {
  if (type === "success") {
    return <CheckCircle2 size={18} strokeWidth={2.2} />;
  }

  if (type === "warning") {
    return <AlertTriangle size={18} strokeWidth={2.2} />;
  }

  if (type === "error") {
    return <XCircle size={18} strokeWidth={2.2} />;
  }

  if (type === "info") {
    return <Info size={18} strokeWidth={2.2} />;
  }

  return <Bell size={18} strokeWidth={2.2} />;
}

function NotificationItem({
  notification,
  onClose,
}: {
  notification: InternalNotification;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    if (notification.duration <= 0 || notification.phase !== "open") {
      return undefined;
    }

    const timer = window.setTimeout(() => onClose(notification.id), notification.duration);
    return () => window.clearTimeout(timer);
  }, [notification.duration, notification.id, notification.phase, onClose]);

  return (
    <div
      className={[
        "lon-notification",
        `lon-notification-${notification.type}`,
        notification.phase === "closing" ? "is-closing" : "",
        notification.phase === "collapsing" ? "is-collapsing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-hidden={notification.phase !== "open" ? true : undefined}
    >
      <span className="lon-notification-icon" aria-hidden="true">
        <NotificationIcon type={notification.type} />
      </span>
      <span className="lon-notification-copy">
        <strong>{notification.title}</strong>
        {notification.description ? <span>{notification.description}</span> : null}
      </span>
      {notification.closable ? (
        <button
          className="lon-notification-close"
          type="button"
          aria-label="关闭通知"
          onClick={() => onClose(notification.id)}
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

export function LonNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const transitionTimersRef = useRef<Record<string, number[]>>({});

  const scheduleNotificationRemoval = useCallback((notificationId: string) => {
    if (transitionTimersRef.current[notificationId]) {
      return;
    }

    const collapseTimer = window.setTimeout(() => {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId && notification.phase === "closing"
            ? { ...notification, phase: "collapsing" }
            : notification,
        ),
      );
    }, NOTIFICATION_EXIT_DURATION);
    const removeTimer = window.setTimeout(() => {
      setNotifications((currentNotifications) =>
        currentNotifications.filter((notification) => notification.id !== notificationId),
      );
      delete transitionTimersRef.current[notificationId];
    }, NOTIFICATION_EXIT_DURATION + NOTIFICATION_COLLAPSE_DURATION);

    transitionTimersRef.current[notificationId] = [collapseTimer, removeTimer];
  }, []);

  const destroy = useCallback((id?: string) => {
    setNotifications((currentNotifications) => {
      const closingIds = id ? [id] : currentNotifications.map((notification) => notification.id);

      closingIds.forEach(scheduleNotificationRemoval);

      return currentNotifications.map((notification) =>
        closingIds.includes(notification.id) && notification.phase === "open"
          ? { ...notification, phase: "closing" }
          : notification,
      );
    });
  }, [scheduleNotificationRemoval]);

  useEffect(
    () => () => {
      Object.values(transitionTimersRef.current).forEach((timers) =>
        timers.forEach((timer) => window.clearTimeout(timer)),
      );
      transitionTimersRef.current = {};
    },
    [],
  );

  const open = useCallback((options: LonNotificationOptions) => {
    const type = options.type ?? "info";
    const defaults = getNotificationDefaults(options.duration, options.closable, options.placement);
    const id = createNotificationId();

    setNotifications((currentNotifications) => {
      const activeNotifications = currentNotifications.filter((notification) => notification.phase === "open");
      const overflowCount = Math.max(0, activeNotifications.length + 1 - NOTIFICATION_MAX_COUNT);
      const overflowIds = activeNotifications.slice(0, overflowCount).map((notification) => notification.id);

      overflowIds.forEach(scheduleNotificationRemoval);

      return [
        ...currentNotifications.map((notification) =>
          overflowIds.includes(notification.id) ? { ...notification, phase: "closing" as const } : notification,
        ),
        {
          id,
          type,
          title: options.title,
          description: options.description,
          duration: defaults.duration,
          closable: defaults.closable,
          placement: defaults.placement,
          phase: "open",
        },
      ];
    });

    return id;
  }, [scheduleNotificationRemoval]);

  const api = useMemo<LonNotificationApi>(
    () => ({
      open,
      success: (options) => open({ ...options, type: "success" }),
      info: (options) => open({ ...options, type: "info" }),
      warning: (options) => open({ ...options, type: "warning" }),
      error: (options) => open({ ...options, type: "error" }),
      destroy,
    }),
    [destroy, open],
  );

  const leftNotifications = notifications.filter((notification) => notification.placement === "left");
  const rightNotifications = notifications.filter((notification) => notification.placement === "right");

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <div className="lon-notification-viewport lon-notification-viewport-left" aria-label="左侧通知">
        {leftNotifications.map((notification) => (
          <NotificationItem notification={notification} onClose={destroy} key={notification.id} />
        ))}
      </div>
      <div className="lon-notification-viewport lon-notification-viewport-right" aria-label="右侧通知">
        {rightNotifications.map((notification) => (
          <NotificationItem notification={notification} onClose={destroy} key={notification.id} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useLonNotification() {
  const api = useContext(NotificationContext);

  if (!api) {
    throw new Error("useLonNotification must be used within LonNotificationProvider");
  }

  return api;
}
