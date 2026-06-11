import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";
import {
  deleteMandate,
  ensureDealForMandate,
  findMandateById,
  updateMandate,
  updateMandateSchema,
} from "@/modules/mandates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const mandate = await findMandateById(id);
    if (!mandate) {
      return NextResponse.json({ error: "Mandat introuvable" }, { status: 404 });
    }
    return NextResponse.json(mandate);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await findMandateById(id);
    if (!existing) {
      return NextResponse.json({ error: "Mandat introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateMandateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const update: Prisma.MandateUpdateInput = {};

    if (data.kind !== undefined) update.kind = data.kind;
    if (data.status !== undefined) {
      update.status = data.status;
      // Stamp the signature date the first time the mandate is marked signed.
      if (data.status === "SIGNE" && !existing.signedAt && data.signedAt === undefined) {
        update.signedAt = new Date();
      }
    }
    if (data.signedAt !== undefined) {
      update.signedAt = data.signedAt ? new Date(data.signedAt) : null;
    }
    if (data.startDate !== undefined) update.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      update.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.feesPercent !== undefined) update.feesPercent = data.feesPercent || null;
    if (data.feesAmount !== undefined) update.feesAmount = data.feesAmount || null;
    if (data.feesPayer !== undefined) update.feesPayer = data.feesPayer || null;
    if (data.notes !== undefined) update.notes = data.notes || null;
    if (data.contactId !== undefined) {
      update.contact = data.contactId
        ? { connect: { id: data.contactId } }
        : { disconnect: true };
    }
    if (data.propertyId !== undefined) {
      update.property = data.propertyId
        ? { connect: { id: data.propertyId } }
        : { disconnect: true };
    }

    const mandate = await updateMandate(id, update);

    // A signed mandate enters the pipeline: create the deal automatically.
    if (data.status === "SIGNE" && !existing.dealId) {
      await ensureDealForMandate(id).catch(() => null);
      const fresh = await findMandateById(id);
      return NextResponse.json(fresh ?? mandate);
    }

    return NextResponse.json(mandate);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await deleteMandate(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
