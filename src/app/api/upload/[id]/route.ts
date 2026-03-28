import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const media = await prisma.propertyMedia.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
    }

    // Extract the path from the full URL to delete from storage
    const url = new URL(media.url);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
    if (pathParts.length > 1) {
      await supabase.storage.from(STORAGE_BUCKET).remove([pathParts[1]]);
    }

    // If this was primary, assign primary to next photo
    const wasPrimary = media.isPrimary;
    await prisma.propertyMedia.delete({ where: { id } });

    if (wasPrimary) {
      const next = await prisma.propertyMedia.findFirst({
        where: { propertyId: media.propertyId },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await prisma.propertyMedia.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
