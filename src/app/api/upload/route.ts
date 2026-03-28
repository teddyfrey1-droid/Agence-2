import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Type de fichier non supporté. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    // Generate unique path
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const path = `${entityType}/${entityId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Erreur lors de l'upload: " + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
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
      const spot = await prisma.fieldSpotting.update({
        where: { id: entityId },
        data: { photoUrl: publicUrl },
      });

      return NextResponse.json({ url: publicUrl, spotId: spot.id });
    }

    return NextResponse.json({ error: "Type d'entité non supporté" }, { status: 400 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
