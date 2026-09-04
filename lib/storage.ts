import type { Caller } from '@/lib/authz'

/**
 * How long a minted storage URL stays valid. Pages that render photos are
 * `force-dynamic`, so a fresh URL is issued on every request; this only has
 * to outlive a single page view.
 */
export const SIGNED_URL_TTL_SECONDS = 60 * 60

type Storage = Caller['supabase']

/**
 * Mints short-lived signed URLs for a set of storage paths.
 *
 * Photos used to be stored and served as `getPublicUrl()` links against a
 * bucket marked `public = true`, which made every image readable by anyone
 * on the internet who had the URL - no sign-in, and not even the
 * `/object/public/` prefix was required, because a public bucket
 * short-circuits the auth check on the regular object path too.
 *
 * `storage_path` is the source of truth; URLs are derived per request and
 * expire, so a leaked link stops working.
 */
export async function signPaths(
  supabase: Storage,
  bucket: string,
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const signed = new Map<string, string>()
  const unique = [...new Set(paths.filter((p): p is string => !!p))]
  if (unique.length === 0) return signed

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    console.error(`[storage:signPaths:${bucket}]`, error?.message ?? 'no data')
    return signed
  }

  for (const row of data) {
    if (row.signedUrl && row.path) signed.set(row.path, row.signedUrl)
  }

  return signed
}

export async function signPath(
  supabase: Storage,
  bucket: string,
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null
  const signed = await signPaths(supabase, bucket, [path])
  return signed.get(path) ?? null
}
