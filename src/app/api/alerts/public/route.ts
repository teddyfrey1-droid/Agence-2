import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";

const createAlertSchema = z.object({
  email: z.string().email("Email invalide").max(254),
  transactionType: z
    .string()
    .refine((v) => v in TRANSACTION_TYPE_LABELS, "Transaction inconnue")
    .optional(),
  propertyTypes: z
    .array(z.string().refine((v) => v in PROPERTY_TYPE_LABELS, "Type inconnu"))
    .max(20)
    .default([]),
  districts: z.array(z.string().max(40)).max(25).default([]),
  budgetMax: z.number().int().positive().max(100_000_000).optional(),
  surfaceMin: z.number().int().positive().max(1_000_000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const email = data.email.trim().toLowerCase();

    // Cap subscriptions per address to keep the endpoint abuse-safe
    const existingCount = await prisma.propertyAlert.count({
      where: { email, isActive: true },
    });
    if (existingCount >= 5) {
      return NextResponse.json(
        { error: "Vous avez déjà atteint le nombre maximum d'alertes pour cet email." },
        { status: 429 }
      );
    }

    await prisma.propertyAlert.create({
      data: {
        email,
        transactionType: data.transactionType || null,
        propertyTypes: data.propertyTypes,
        districts: data.districts,
        budgetMax: data.budgetMax ?? null,
        surfaceMin: data.surfaceMin ?? null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
