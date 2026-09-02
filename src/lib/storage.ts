import { SupabaseClient } from "@supabase/supabase-js";

export type StorageBucket = "blueprints" | "project-documents" | "site-photos" | "punch-photos";

/**
 * Normalizes a stored file path or full Supabase URL into a relative storage path.
 */
export function extractStoragePath(pathOrUrl: string, bucket: StorageBucket): string {
  if (!pathOrUrl) return "";

  // If it's a full Supabase storage URL, strip domain and bucket prefix
  const publicPrefix = `/storage/v1/object/public/${bucket}/`;
  const signPrefix = `/storage/v1/object/sign/${bucket}/`;

  if (pathOrUrl.includes(publicPrefix)) {
    return decodeURIComponent(pathOrUrl.substring(pathOrUrl.indexOf(publicPrefix) + publicPrefix.length).split("?")[0]);
  }
  if (pathOrUrl.includes(signPrefix)) {
    return decodeURIComponent(pathOrUrl.substring(pathOrUrl.indexOf(signPrefix) + signPrefix.length).split("?")[0]);
  }

  // If it starts with the bucket name itself, strip it
  if (pathOrUrl.startsWith(`${bucket}/`)) {
    return pathOrUrl.replace(`${bucket}/`, "");
  }

  return pathOrUrl;
}

/**
 * Checks if a URL is an external web link (e.g. Unsplash) rather than a Supabase storage path.
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) && !url.includes("supabase.co");
}

/**
 * Generates a temporary signed URL for a file in a private Supabase bucket.
 * @param supabase The Supabase client instance
 * @param bucket Target storage bucket
 * @param pathOrUrl Stored path or existing URL
 * @param expiresIn Expiration in seconds (default 300 = 5 minutes)
 */
export async function getSignedFileUrl(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  pathOrUrl: string,
  expiresIn: number = 300
): Promise<string | null> {
  if (!pathOrUrl) return null;

  // External links do not need signed URLs
  if (isExternalUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const cleanPath = extractStoragePath(pathOrUrl, bucket);
  if (!cleanPath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      console.warn(`[storage] Failed to create signed URL for ${bucket}/${cleanPath}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err: any) {
    console.error(`[storage] Error generating signed URL for ${bucket}/${cleanPath}:`, err?.message);
    return null;
  }
}

/**
 * Batch generates signed URLs for multiple files (e.g., thumbnail gallery or list previews).
 * @param supabase The Supabase client instance
 * @param bucket Target storage bucket
 * @param paths Array of stored paths or URLs
 * @param expiresIn Expiration in seconds (default 3600 = 1 hour)
 */
export async function batchGetSignedUrls(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  paths: string[],
  expiresIn: number = 3600
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!paths || paths.length === 0) return result;

  const validPaths = paths.filter(Boolean);

  await Promise.all(
    validPaths.map(async (rawPath) => {
      if (isExternalUrl(rawPath)) {
        result[rawPath] = rawPath;
        return;
      }

      const cleanPath = extractStoragePath(rawPath, bucket);
      if (!cleanPath) return;

      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(cleanPath, expiresIn);

        if (!error && data?.signedUrl) {
          result[rawPath] = data.signedUrl;
        }
      } catch (err) {
        console.warn(`[storage] Batch signing failed for ${rawPath}:`, err);
      }
    })
  );

  return result;
}