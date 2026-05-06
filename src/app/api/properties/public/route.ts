import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handlePublicPropertyProposal } from "@/modules/contacts";
import { applyRateLimit, PUBLIC_FORM_RATE_LIMIT } from "@/lib/rate-limit";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().min(3),
  city: z.string().optional(),
  propertyType: z.string().optional(),
  transactionType: z.string().optional(),
  surface: z.number().positive().optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  /** Anti-spam — must be empty */
  honeypot: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 submissions per minute per IP — was missing.
    const rateLimited = await applyRateLimit(
      "properties-public",
      request.headers,
      PUBLIC_FORM_RATE_LIMIT
    );
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Honeypot — silent accept (don't reveal the trap)
    if (parsed.data.honeypot) {
      return NextResponse.json({ success: true });
    }

    const result = await handlePublicPropertyProposal(parsed.data);
    return NextResponse.json({ success: true, contactId: result.contact.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
