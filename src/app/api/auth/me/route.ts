import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";

export async function GET() {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    firstName: session.firstName,
    lastName: session.lastName,
    role: session.role,
  });
}
