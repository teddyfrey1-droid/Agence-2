import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findSearchRequestById, updateSearchRequest } from "@/modules/search-requests";
import { updateSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const request = await findSearchRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }
    return NextResponse.json(request);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const updated = await updateSearchRequest(id, {
      ...(data.propertyTypes !== undefined && { propertyTypes: data.propertyTypes as never }),
      ...(data.transactionType !== undefined && { transactionType: data.transactionType as never }),
      ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
      ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
      ...(data.surfaceMin !== undefined && { surfaceMin: data.surfaceMin }),
      ...(data.surfaceMax !== undefined && { surfaceMax: data.surfaceMax }),
      ...(data.activity !== undefined && { activity: data.activity }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.districts !== undefined && { districts: data.districts }),
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.searchRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
