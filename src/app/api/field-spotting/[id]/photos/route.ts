import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { requireSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasPermission(session.role, "field_spotting", "update")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const { id } = await params;
  const { photoUrl } = await request.json();

  if (!photoUrl) return NextResponse.json({ error: "URL requise" }, { status: 400 });

  try {
    const spot = await prisma.fieldSpotting.findUnique({
      where: { id },
      select: { photos: true, photoUrl: true },
    });
    if (!spot) return NextResponse.json({ error: "Repérage introuvable" }, { status: 404 });

    // Remove from storage
    try {
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
      if (pathParts.length > 1) {
        await requireSupabase().storage.from(STORAGE_BUCKET).remove([pathParts[1]]);
      }
    } catch {
      // continue even if storage removal fails
    }

    const updatedPhotos = (spot.photos ?? []).filter((p) => p !== photoUrl);

    await prisma.fieldSpotting.update({
      where: { id },
      data: {
        photos: updatedPhotos,
        photoUrl: updatedPhotos[0] ?? null,
      },
    });

    return NextResponse.json({ photos: updatedPhotos });
  } catch (err) {
    console.error("Delete terrain photo error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
