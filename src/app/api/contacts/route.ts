import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createContactSchema } from "@/modules/contacts/contacts.schema";
import { createNewContact } from "@/modules/contacts";
import { findContacts } from "@/modules/contacts/contacts.repository";

export async function GET(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || undefined;
  const type = searchParams.get("type")?.trim() || undefined;
  const source = searchParams.get("source")?.trim() || undefined;
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
  const perPage = Math.min(
    Math.max(parseInt(searchParams.get("perPage") || "20", 10) || 20, 1),
    100
  );

  try {
    const result = await findContacts(
      { search, type, source, isActive: true },
      page,
      perPage
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "contact", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const contact = await createNewContact(parsed.data);
    return NextResponse.json(contact, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
