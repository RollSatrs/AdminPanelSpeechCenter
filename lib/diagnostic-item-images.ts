import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function sanitizeBaseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "diagnostic-item";
}

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "bin";
}

export async function saveDiagnosticItemImage(file: File, slugOrWord: string) {
  const mimeType = file.type || "";
  if (!mimeType.startsWith("image/")) {
    throw new Error("Нужен файл изображения")
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "diagnostic-items");
  await mkdir(uploadDir, { recursive: true });

  const baseName = sanitizeBaseName(slugOrWord);
  const extension = extensionFromMimeType(mimeType);
  const fileName = `${baseName}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, fileBuffer);

  return `/uploads/diagnostic-items/${fileName}`;
}
