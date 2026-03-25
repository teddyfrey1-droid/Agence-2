import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handlePublicPropertyProposal } from "@/modules/contacts";

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
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await handlePublicPropertyProposal(parsed.data);
    return NextResponse.json({ success: true, contactId: result.contact.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
