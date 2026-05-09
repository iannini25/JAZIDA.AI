// GET /api/dashboard/agent-events/stream — Server-Sent Events
//
// Stream em tempo real:
//   - 1) snapshot inicial: ultimos 20 eventos
//   - 2) push em emit: cada emitAgentEvent dispara um event "agent-event"
//   - 3) heartbeat a cada 2s pra dashboard sempre ter pulso visual
//
// Cliente desconecta (req.signal abort) -> limpa interval + unsub.

import { db, subscribeAgentEvents } from "@/lib/db";
import type { AgentEvent } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 2000;

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload =
          `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };

      send("snapshot", {
        events: db.agentEvents.slice(0, 20),
        sentAt: new Date().toISOString(),
      });

      const unsub = subscribeAgentEvents((event: AgentEvent) => {
        send("agent-event", event);
      });

      const heartbeat = setInterval(() => {
        send("heartbeat", { ts: new Date().toISOString() });
      }, HEARTBEAT_MS);

      const onAbort = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      req.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
