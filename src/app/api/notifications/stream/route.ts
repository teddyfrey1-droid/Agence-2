import { NextRequest } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { subscribe, type RealtimeEvent } from "@/lib/event-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream for real-time notifications.
 *
 * Replaces the 30-second polling loop in <NotificationBell> with instant
 * pushes. Clients receive JSON payloads prefixed with `data:`; the browser's
 * EventSource API reconnects automatically on network blips.
 */
export async function GET(_req: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.userId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (event: RealtimeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Initial hello so clients can confirm the connection is alive.
      send({ type: "ping" });

      const unsubscribe = subscribe(userId, send);

      // Keep-alive comment every 25s — prevents proxies/load balancers from
      // closing the connection as idle.
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          closed = true;
        }
      }, 25000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // The AbortSignal fires when the client disconnects.
      _req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
