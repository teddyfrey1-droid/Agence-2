/**
 * In-memory event bus for real-time notifications via SSE.
 *
 * Each connected user can subscribe with a writer; the notifications service
 * calls `publish(userId, payload)` to push events instantly.
 *
 * This runs in a single Node.js process, so it fits Vercel serverless fine
 * for a single-region deployment where the user and the publisher hit the
 * same lambda. If you scale horizontally, swap this for Redis Pub/Sub or
 * Upstash.
 */

export interface RealtimeEvent {
  type: "notification" | "ping" | "unread-count";
  id?: string;
  title?: string;
  message?: string;
  link?: string;
  unreadCount?: number;
  createdAt?: string;
}

type Listener = (event: RealtimeEvent) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(userId: string, listener: Listener): () => void {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(listener);

  return () => {
    const current = listeners.get(userId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) listeners.delete(userId);
  };
}

export function publish(userId: string, event: RealtimeEvent): void {
  const set = listeners.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(event);
    } catch {
      // Swallow — a dead listener shouldn't break the broadcast.
    }
  }
}

export function hasSubscribers(userId: string): boolean {
  const set = listeners.get(userId);
  return !!set && set.size > 0;
}
