/**
 * File content validation via magic bytes.
 *
 * The `file.type` on a browser-provided File is user-controllable — a
 * malicious client can send `image/png` with a .exe payload. The only reliable
 * way to know what's really inside is to inspect the first bytes of the file.
 */

export type ImageKind = "jpeg" | "png" | "webp" | "heic" | "gif";

const MIME_BY_KIND: Record<ImageKind, string[]> = {
  jpeg: ["image/jpeg", "image/jpg"],
  png: ["image/png"],
  webp: ["image/webp"],
  heic: ["image/heic", "image/heif"],
  gif: ["image/gif"],
};

/**
 * Identify the image kind of a buffer from its magic bytes. Returns null if
 * the signature doesn't match any supported image format.
 */
export function detectImageKind(buf: Uint8Array): ImageKind | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: 47 49 46 38 (37|39) 61
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return "gif";
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }

  // HEIC / HEIF: .... "ftyp" then brand "heic"/"heix"/"mif1"/"msf1"
  if (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    if (["heic", "heix", "heim", "heis", "mif1", "msf1"].includes(brand)) {
      return "heic";
    }
  }

  return null;
}

/**
 * Check a File object against a whitelist of image kinds. Validates both the
 * declared MIME type and the actual file content (magic bytes).
 */
export async function validateImageFile(
  file: File,
  allowedKinds: ImageKind[]
): Promise<
  | { ok: true; kind: ImageKind; contentType: string }
  | { ok: false; error: string }
> {
  // Declared MIME type whitelist
  const allowedMimes = allowedKinds.flatMap((k) => MIME_BY_KIND[k]);
  if (!allowedMimes.includes(file.type)) {
    return { ok: false, error: "Type de fichier non supporté" };
  }

  // Read the first bytes to detect the real content
  const headerSize = Math.min(file.size, 16);
  const header = new Uint8Array(await file.slice(0, headerSize).arrayBuffer());
  const actualKind = detectImageKind(header);
  if (!actualKind) {
    return { ok: false, error: "Contenu du fichier non reconnu" };
  }
  if (!allowedKinds.includes(actualKind)) {
    return { ok: false, error: "Le fichier ne correspond pas à son extension" };
  }

  // Declared MIME and actual content must match
  if (!MIME_BY_KIND[actualKind].includes(file.type)) {
    return { ok: false, error: "Incohérence entre le type déclaré et le contenu" };
  }

  return { ok: true, kind: actualKind, contentType: file.type };
}
