import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Images must be 8MB or smaller.";
  }
  return null;
}

export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file; // compression would drop animation
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file;
  }
}

export async function uploadToBucket(
  bucket: "gallery" | "banners",
  file: File,
  pathPrefix: string
) {
  const supabase = createClient();
  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    contentType: file.type,
  });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
