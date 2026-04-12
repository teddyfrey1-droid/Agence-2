import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { requireSupabase, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { validateImageFile } from "@/lib/file-validation";

export async function POST(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string; // "property" | "fieldSpotting"
    const entityId = formData.get("entityId") as string;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: "Fichier, type et ID requis" }, { status: 400 });
    }

    // Permission checks based on entity type
    if (entityType === "property") {
      if (!hasPermission(session.role, "property", "update")) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
      }
      const property = await prisma.property.findUnique({ where: { id: entityId }, select: { id: true } });
      if (!property) {
        return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
      }
    } else if (entityType === "fieldSpotting") {
      if (!hasPermission(session.role, "field_spotting", "update")) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
      }
      const spot = await prisma.fieldSpotting.findUnique({ where: { id: entityId }, select: { id: true } });
      if (!spot) {
        return NextResponse.json({ error: "Repérage introuvable" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "Type d'entité non supporté" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    // Validate file type AND content (magic bytes) — prevents spoofed MIME types
    const validation = await validateImageFile(file, ["jpeg", "png", "webp", "heic"]);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate unique path using the detected kind (not the user-supplied name)
    const extByKind: Record<string, string> = {
      jpeg: "jpg",
      png: "png",
      webp: "webp",
      heic: "heic",
      gif: "gif",
    };
    const ext = extByKind[validation.kind] || "bin";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const path = `${entityType}/${entityId}/${timestamp}-${random}.${ext}`;

    // Upload to Supabase Storage
    const storage = requireSupabase();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await storage.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = storage.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    if (entityType === "property") {
      // If marking as primary, unset any existing primary
      if (isPrimary) {
        await prisma.propertyMedia.updateMany({
          where: { propertyId: entityId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Check if this is the first photo (make it primary automatically)
      const existingCount = await prisma.propertyMedia.count({
        where: { propertyId: entityId },
      });

      const media = await prisma.propertyMedia.create({
        data: {
          propertyId: entityId,
          url: publicUrl,
          type: "PHOTO",
          title: file.name,
          isPrimary: isPrimary || existingCount === 0,
          sortOrder: existingCount,
        },
      });

      return NextResponse.json(media);
    }

    if (entityType === "fieldSpotting") {
      // Fetch existing photos array
      const existing = await prisma.fieldSpotting.findUnique({
        where: { id: entityId },
        select: { photos: true },
      });
      const currentPhotos = existing?.photos ?? [];
      const updatedPhotos = [...currentPhotos, publicUrl];

      const spot = await prisma.fieldSpotting.update({
        where: { id: entityId },
        data: {
          photoUrl: updatedPhotos[0], // keep first as primary for backward compat
          photos: updatedPhotos,
        },
      });

      return NextResponse.json({ url: publicUrl, spotId: spot.id, photos: spot.photos });
    }

    return NextResponse.json({ error: "Type d'entité non supporté" }, { status: 400 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
