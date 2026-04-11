import { NextRequest, NextResponse } from "next/server";
import { publicContactFormSchema } from "@/modules/contacts/contacts.schema";
import { handlePublicContactForm } from "@/modules/contacts";
import { applyRateLimit, PUBLIC_FORM_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 submissions per minute per IP
    const rateLimited = applyRateLimit("contacts-public", request.headers, PUBLIC_FORM_RATE_LIMIT);
    if (rateLimited) return rateLimited;

    const body = await request.json();
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
