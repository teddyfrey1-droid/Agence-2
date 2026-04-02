import { NextRequest, NextResponse } from "next/server";
import { publicSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { handlePublicSearchRequestForm } from "@/modules/contacts";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT = { maxRequests: 5, windowSeconds: 60 };

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request.headers);
    const limit = checkRateLimit(`search-requests-public:${ip}`, RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      );
    }

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
