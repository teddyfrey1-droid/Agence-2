import { NextRequest, NextResponse } from "next/server";
import { publicSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { handlePublicSearchRequestForm } from "@/modules/contacts";

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(
      { success: true, requestId: result.searchRequest.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
