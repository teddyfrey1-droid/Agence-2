/**
 * Apply a simple brand watermark + light auto-retouching (contrast +10 %,
 * saturation +8 %) to a user photo, all on the client. Returns a new File
 * that can be fed back into the existing /api/upload pipeline.
 */
export interface WatermarkOptions {
  text: string;
  maxWidth?: number;
  quality?: number;
  retouch?: boolean;
}

export async function watermarkAndRetouch(
  file: File,
  { text, maxWidth = 1920, quality = 0.86, retouch = true }: WatermarkOptions
): Promise<File> {
  if (file.type === "image/heic" || file.type === "image/heif") return file;

  const img = await loadImage(file);
  let { width, height } = img;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  if (retouch) {
    // Use CSS filter for a subtle "pro" pass — readable, reversible, cheap.
    ctx.filter = "contrast(1.08) saturate(1.08) brightness(1.02)";
  }
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = "none";

  // Watermark: bottom-right, semi-transparent pill
  const pad = Math.max(16, Math.round(width * 0.012));
  const fontSize = Math.max(14, Math.round(width * 0.018));
  ctx.font = `600 ${fontSize}px 'Inter','Helvetica Neue',Arial,sans-serif`;
  const label = text.slice(0, 60);
  const metrics = ctx.measureText(label);
  const boxW = Math.ceil(metrics.width) + pad * 1.6;
  const boxH = Math.ceil(fontSize * 1.8);
  const boxX = width - boxW - pad;
  const boxY = height - boxH - pad;

  ctx.fillStyle = "rgba(17, 17, 19, 0.55)";
  roundRect(ctx, boxX, boxY, boxW, boxH, boxH / 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, boxX + pad * 0.8, boxY + boxH / 2);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, "") + "-wm.jpg";
        resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
      },
      "image/jpeg",
      quality
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
