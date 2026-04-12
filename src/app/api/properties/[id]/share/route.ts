import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSession } from "@/lib/auth";
import { sendPropertyShareEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: propertyId } = await params;
  const body = await request.json();
  const { recipientEmail, recipientName, contactId, message } = body;

  if (!recipientEmail) {
    return NextResponse.json({ error: "Email du destinataire requis" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { media: { where: { isPrimary: true }, take: 1 } },
  });

  if (!property) {
    return NextResponse.json({ error: "Bien non trouvé" }, { status: 404 });
  }

  const share = await prisma.propertyShare.create({
    data: {
      propertyId,
      sentById: session.userId,
      recipientEmail,
      recipientName: recipientName || null,
      contactId: contactId || null,
      message: message || null,
    },
  });

  // Send email
  sendPropertyShareEmail({
    to: recipientEmail,
    recipientName: recipientName || "",
    propertyTitle: property.title,
    propertyReference: property.reference,
    propertyCity: property.city,
    propertyPrice: property.price,
    propertyRent: property.rentMonthly,
    transactionType: property.transactionType,
    shareToken: share.shareToken,
    senderName: `${session.firstName} ${session.lastName}`,
    message: message || undefined,
  }).catch(() => {});

  return NextResponse.json(share, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: propertyId } = await params;

  const shares = await prisma.propertyShare.findMany({
    where: { propertyId },
    include: {
      sentBy: { select: { firstName: true, lastName: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json(shares);
}
