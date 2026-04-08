import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Track share opens — called when a client views a shared property
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action, duration } = body;

  const share = await prisma.propertyShare.findUnique({ where: { shareToken: id } });
  if (!share) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  if (action === "open") {
    await prisma.propertyShare.update({
      where: { id: share.id },
      data: {
        openedAt: share.openedAt || new Date(),
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  } else if (action === "duration" && typeof duration === "number") {
    await prisma.propertyShare.update({
      where: { id: share.id },
      data: {
        totalViewDuration: { increment: duration },
        lastViewedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
