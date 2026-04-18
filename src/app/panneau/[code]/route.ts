import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgencyInfo } from "@/lib/agency";
import { createNotification } from "@/modules/notifications";
import {
  buildPanelWaMessage,
  buildWhatsAppLink,
  resolvePanelForScan,
} from "@/modules/panels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public QR landing for street panels.
 *
 * The QR encodes /panneau/<code>. We:
 *  1. Resolve the panel to a property + agent (with agency phone fallback).
 *  2. Log the scan (PanelScan + ClientTracking-like trace) so the agent sees
 *     that the panel is generating activity.
 *  3. Notify the agent in real-time via the existing SSE bus.
 *  4. Redirect the visitor straight to WhatsApp with a prefilled message.
 *
 * If no property is currently mapped, we render an HTML interstitial instead
 * of returning 404 — panels live for years and may briefly be in rotation.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const panel = await resolvePanelForScan(code);

  if (!panel) {
    return interstitial({
      title: "Panneau inconnu",
      message: "Ce code ne correspond à aucun panneau actif. Contactez l'agence pour plus d'informations.",
    });
  }

  if (panel.status === "RETIRE" || !panel.property) {
    return interstitial({
      title: "Bien en cours de mise à jour",
      message: "Ce panneau est en repositionnement. Notre équipe revient vers vous très vite.",
    });
  }

  const property = panel.property;
  const agent = panel.agentOverride ?? property.assignedTo;
  const agency = await getAgencyInfo();

  const phone = agent?.phone || agency.phone;
  const message = buildPanelWaMessage({
    reference: property.reference,
    title: property.title,
    type: property.type,
    transactionType: property.transactionType,
    surfaceTotal: property.surfaceTotal,
    city: property.city,
    district: property.district,
  });

  const wa = buildWhatsAppLink({ phone, message });

  // Fire-and-forget: don't make the visitor wait on tracking + notif before
  // their phone opens WhatsApp.
  void (async () => {
    try {
      await prisma.panelScan.create({
        data: {
          panelId: panel.id,
          propertyId: property.id,
          agentId: agent?.id ?? null,
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: req.headers.get("user-agent")?.slice(0, 500) || null,
        },
      });
      if (agent?.id) {
        await createNotification({
          userId: agent.id,
          type: "CLIENT_REQUEST",
          title: "Panneau scanné",
          message: `${panel.code} → ${property.reference}${property.title ? ` (${property.title})` : ""}`,
          link: `/dashboard/biens/${property.id}`,
        });
      }
    } catch (err) {
      console.error("[panneau scan] tracking failed", err);
    }
  })();

  if (!wa) {
    // No usable phone anywhere — show the property reference and the agency
    // info so the prospect can still get in touch.
    return interstitial({
      title: property.title || property.reference,
      message: `Référence : ${property.reference}. Merci de contacter ${agency.name}${agency.email ? ` à ${agency.email}` : ""}.`,
    });
  }

  return NextResponse.redirect(wa, { status: 302 });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function interstitial(opts: { title: string; message: string }) {
  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #faf8f3; color: #23211e; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { max-width: 28rem; background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.06); text-align: center; }
    h1 { color: #8B6914; font-size: 1.5rem; margin: 0 0 1rem; }
    p { color: #555; line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(opts.title)}</h1>
    <p>${escapeHtml(opts.message)}</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
