import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createPropertySchema } from "@/modules/properties/properties.schema";
import { createNewProperty, findProperties } from "@/modules/properties";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const published = searchParams.get("published");

    if (published === "true") {
      // Public endpoint for map
      const { findPublishedProperties } = await import("@/modules/properties");
      const result = await findPublishedProperties(page, 100);
      return NextResponse.json(result);
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const result = await findProperties(
      {
        status: searchParams.get("status") || undefined,
        type: searchParams.get("type") || undefined,
        search: searchParams.get("search") || undefined,
      },
      page
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "property", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const property = await createNewProperty(parsed.data, session.userId);
    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
