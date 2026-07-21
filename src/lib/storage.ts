import type { SupabaseClient } from "@supabase/supabase-js";

export async function createSafeSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = 600,
) {
  const cleanPath = path?.trim();
  if (!cleanPath) return "";

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn);
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Storage signed URL unavailable", {
          bucket,
          message: error.message,
          path: cleanPath,
        });
      }
      return "";
    }
    return data?.signedUrl ?? "";
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Storage signed URL failed", { bucket, error, path: cleanPath });
    }
    return "";
  }
}