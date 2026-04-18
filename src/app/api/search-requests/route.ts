import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import {
  createSearchRequest,
  rescoreSearchRequest,
  HOT_LEAD_THRESHOLD,
} from "@/modules/search-requests";
import { generateReference } from "@/lib/utils";
import { runMatchingForSearchRequest } from "@/modules/matching";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/modules/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "search_request", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const sr = await createSearchRequest({
      reference: generateReference("DR"),
      status: "NOUVELLE",
      source: "AUTRE",
      propertyTypes: data.propertyTypes as never[],
      transactionType: data.transactionType as never,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      surfaceMin: data.surfaceMin ?? null,
      surfaceMax: data.surfaceMax ?? null,
      districts: data.districts,
      quarters: data.quarters,
      cities: data.cities,
      activity: data.activity ?? null,
      description: data.description ?? null,
      notes: data.notes ?? null,
      ...(data.contactId ? { contact: { connect: { id: data.contactId } } } : {}),
      ...(data.assignedToId ? { assignedTo: { connect: { id: data.assignedToId } } } : {}),
    });

    // Trigger initial matching in the background. We don't await it so the
    // request doesn't block on what can be a heavy job, but we catch errors
    // so a matcher crash doesn't surface as a failed POST.
    runMatchingForSearchRequest(sr.id).catch((err) =>
      console.error("[search-requests POST] initial matching failed", err)
    );

    // Auto-score the lead and alert managers if it's hot.
    (async () => {
      try {
        const score = await rescoreSearchRequest(sr.id);
        if (score !== null && score >= HOT_LEAD_THRESHOLD && !sr.assignedToId) {
          const managers = await prisma.user.findMany({
            where: {
              role: { in: ["MANAGER", "DIRIGEANT", "ASSOCIE"] },
              isActive: true,
            },
            select: { id: true },
          });
          await Promise.all(
            managers.map((m) =>
              createNotification({
                userId: m.id,
                type: "CLIENT_REQUEST",
                title: "Lead prioritaire",
                message: `Demande ${sr.reference} — score de qualification ${score}/100`,
                link: `/dashboard/demandes/${sr.id}`,
              })
            )
          );
        }
      } catch (err) {
        console.error("[search-requests POST] scoring/alert failed", err);
      }
    })();

    return NextResponse.json(sr, { status: 201 });
  } catch (err) {
    console.error("[search-requests POST] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
