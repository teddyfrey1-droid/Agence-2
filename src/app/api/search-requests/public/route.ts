import { NextRequest, NextResponse } from "next/server";
import { publicSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { handlePublicSearchRequestForm } from "@/modules/contacts";
import { applyRateLimit, PUBLIC_FORM_RATE_LIMIT } from "@/lib/rate-limit";
import { runMatchingForSearchRequest } from "@/modules/matching";
import {
  rescoreSearchRequest,
  HOT_LEAD_THRESHOLD,
} from "@/modules/search-requests";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/modules/notifications";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 submissions per minute per IP
    const rateLimited = await applyRateLimit("search-requests-public", request.headers, PUBLIC_FORM_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = publicSearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.honeypot) {
      return NextResponse.json({ success: true });
    }

    const result = await handlePublicSearchRequestForm({
      ...parsed.data,
      budgetMin: parsed.data.budgetMin ?? undefined,
      budgetMax: parsed.data.budgetMax ?? undefined,
      surfaceMin: parsed.data.surfaceMin ?? undefined,
      surfaceMax: parsed.data.surfaceMax ?? undefined,
    });

    const srId = result.searchRequest.id;

    // Kick off matching for the fresh request (fire-and-forget)
    runMatchingForSearchRequest(srId).catch((err) =>
      console.error("[search-requests/public] initial matching failed", err)
    );

    // Immediately alert managers about the new (always-unassigned) lead and
    // upgrade to "priority" if the qualification score is high.
    (async () => {
      try {
        const score = await rescoreSearchRequest(srId);
        const managers = await prisma.user.findMany({
          where: {
            role: { in: ["MANAGER", "DIRIGEANT", "ASSOCIE"] },
            isActive: true,
          },
          select: { id: true },
        });
        const isHot = score !== null && score >= HOT_LEAD_THRESHOLD;
        await Promise.all(
          managers.map((m) =>
            createNotification({
              userId: m.id,
              type: "CLIENT_REQUEST",
              title: isHot ? "Lead prioritaire" : "Nouvelle demande site web",
              message: isHot
                ? `Demande ${result.searchRequest.reference} — score ${score}/100, à attribuer`
                : `Demande ${result.searchRequest.reference} — à attribuer`,
              link: `/dashboard/demandes/${srId}`,
            })
          )
        );
      } catch (err) {
        console.error("[search-requests/public] alert failed", err);
      }
    })();

    return NextResponse.json(
      { success: true, requestId: srId },
      { status: 201 }
    );
  } catch (err) {
    console.error("[search-requests/public] error", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
