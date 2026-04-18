"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  return `il y a ${weeks}sem`;
}

function NotificationIcon({ type }: { type: string }) {
  const className = "h-5 w-5 shrink-0";

  switch (type) {
    case "MATCH_NEW":
    case "MATCH_HIGH":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "PROPERTY_NEW":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22V12h6v10" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01" />
        </svg>
      );
    case "DEAL_UPDATE":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      );
    case "TASK_DUE":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
  }
}

function getUnreadDotColor(type: string): string {
  switch (type) {
    case "MATCH_HIGH":
      return "bg-emerald-500";
    case "MATCH_NEW":
      return "bg-blue-500";
    case "TASK_DUE":
      return "bg-red-500";
    default:
      return "bg-brand-500";
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch + real-time SSE stream (fallback to slow polling if the
  // stream is unavailable — e.g. old browser, proxy stripping text/event-stream).
  useEffect(() => {
    fetchNotifications();

    let es: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const startFallback = () => {
      if (fallbackInterval || disposed) return;
      fallbackInterval = setInterval(fetchNotifications, 60000);
    };

    try {
      es = new EventSource("/api/notifications/stream");
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.type === "notification") {
            // Refresh the full list so counters, ordering and deduping stay
            // authoritative (DB is the source of truth).
            fetchNotifications();
          }
        } catch {
          // Ignore malformed frames
        }
      };
      es.onerror = () => {
        // Browser will auto-reconnect; in the meantime fall back to polling.
        startFallback();
      };
    } catch {
      startFallback();
    }

    // Refetch when the tab regains focus — covers the "laptop was asleep"
    // case where the SSE socket is already dead.
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      es?.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const markAllRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notification.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    }

    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg sm:w-96 dark:border-stone-700/50 dark:bg-anthracite-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-stone-700/50">
            <h3 className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={isLoading}
                className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg
                  className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800 ${
                    !notification.isRead
                      ? "bg-brand-50/50 dark:bg-brand-950/20"
                      : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 ${
                      notification.isRead
                        ? "text-stone-400 dark:text-stone-500"
                        : notification.type === "MATCH_HIGH"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : notification.type === "TASK_DUE"
                            ? "text-red-600 dark:text-red-400"
                            : notification.type === "MATCH_NEW"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-brand-600 dark:text-brand-400"
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          notification.isRead
                            ? "font-normal text-stone-600 dark:text-stone-400"
                            : "font-medium text-anthracite-800 dark:text-stone-200"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${getUnreadDotColor(
                            notification.type
                          )}`}
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-stone-500 dark:text-stone-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-400 dark:text-stone-600">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
