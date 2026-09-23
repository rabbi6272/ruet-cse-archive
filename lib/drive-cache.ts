import { unstable_cache, revalidateTag } from "next/cache";

export const DRIVE_CACHE_TAG = "drive";
export const DRIVE_CACHE_REVALIDATE_SECONDS = 12 * 60 * 60;

export async function invalidateAllDriveCaches(): Promise<boolean> {
  try {
    revalidateTag(DRIVE_CACHE_TAG, "max");
    console.log("[DriveCache] Invalidated all Drive caches (revalidateTag)");
    return true;
  } catch (err) {
    console.error(
      "[DriveCache] Invalidation error:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export async function getCachedDriveData<T>(
  folderId: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = unstable_cache(
    async () => {
      return await fetchFn();
    },
    [`drive_${folderId}`],
    { tags: [DRIVE_CACHE_TAG], revalidate: DRIVE_CACHE_REVALIDATE_SECONDS },
  );

  return await cached();
}