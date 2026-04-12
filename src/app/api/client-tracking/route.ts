import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const { action, entityId, details, duration } = body;

  if (!action) {
    return NextResponse.json({ error: "Action requise" }, { status: 400 });
  }

  const tracking = await prisma.clientTracking.create({
    data: {
      userId: session.userId,
      action,
      entityId: entityId || null,
      details: details || null,
      duration: duration || null,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json(tracking, { status: 201 });
}

// GET: Admin can view tracking for a specific user
export async function GET(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const tracking = await prisma.clientTracking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Aggregate stats
  const stats = await prisma.clientTracking.groupBy({
    by: ["action"],
    where: { userId },
    _count: true,
    _sum: { duration: true },
  });

  const lastLogin = await prisma.clientTracking.findFirst({
    where: { userId, action: "LOGIN" },
    orderBy: { createdAt: "desc" },
  });

  const totalSessions = await prisma.clientTracking.count({
    where: { userId, action: "LOGIN" },
  });

  return NextResponse.json({
    tracking,
    stats,
    lastLogin: lastLogin?.createdAt || null,
    totalSessions,
  });
}
