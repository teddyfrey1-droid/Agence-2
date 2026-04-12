import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { requireSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Check permission to update properties (delete media = update property)
  if (!hasPermission(session.role, "property", "update")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const media = await prisma.propertyMedia.findUnique({
      where: { id },
      include: { property: { select: { id: true, assignedToId: true } } },
    });
    if (!media) {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
    }

    // Non-admin users can only delete media on properties assigned to them
    const isAdmin = hasPermission(session.role, "property", "delete");
    if (!isAdmin && media.property.assignedToId !== session.userId) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // Extract the path from the full URL to delete from storage
    const url = new URL(media.url);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
    if (pathParts.length > 1) {
      await requireSupabase().storage.from(STORAGE_BUCKET).remove([pathParts[1]]);
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
