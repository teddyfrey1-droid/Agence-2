import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { isAIEnabled } from "@/lib/ai";

export async function GET() {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ enabled: isAIEnabled() });
}
