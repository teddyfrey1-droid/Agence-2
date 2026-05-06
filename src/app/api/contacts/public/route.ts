import { NextRequest, NextResponse } from "next/server";
import { publicContactFormSchema } from "@/modules/contacts/contacts.schema";
import { handlePublicContactForm } from "@/modules/contacts";
import { applyRateLimit, getClientIp, PUBLIC_FORM_RATE_LIMIT } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 submissions per minute per IP
    const rateLimited = await applyRateLimit("contacts-public", request.headers, PUBLIC_FORM_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();

    // Turnstile gate — only enforced when TURNSTILE_SECRET is set.
    const turnstileToken =
      body?.["cf-turnstile-response"] ?? body?.turnstileToken;
    const turn = await verifyTurnstile(turnstileToken, getClientIp(request.headers));
    if (!turn.success) {
      return NextResponse.json(
        { error: "Vérification anti-bot échouée. Réessayez." },
        { status: 400 }
      );
    }

    const parsed = publicContactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Honeypot check
    if (parsed.data.honeypot) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    const contact = await handlePublicContactForm(parsed.data);
    return NextResponse.json({ success: true, contactId: contact.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
