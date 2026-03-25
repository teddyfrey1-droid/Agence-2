import { NextRequest, NextResponse } from "next/server";
import { publicContactFormSchema } from "@/modules/contacts/contacts.schema";
import { handlePublicContactForm } from "@/modules/contacts";

export async function POST(request: NextRequest) {
  try {
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
