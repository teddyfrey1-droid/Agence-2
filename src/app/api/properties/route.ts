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
      // Public endpoint for map + homepage
      const { findPublishedProperties } = await import("@/modules/properties");
      const result = await findPublishedProperties(page, 100);
      const res = NextResponse.json(result);
      // Short-lived edge cache + longer SWR window. Published listings don't
      // change often; CDN can serve them for a minute and revalidate in the
      // background for up to 5 minutes.
      res.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
      return res;
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

    // Auto-run matching for the new property (non-blocking)
    import("@/modules/matching").then(({ runMatchingForProperty }) => {
      runMatchingForProperty(property.id).catch(console.error);
    });

    return NextResponse.json(property, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
