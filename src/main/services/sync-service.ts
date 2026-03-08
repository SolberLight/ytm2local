import { BrowserWindow } from "electron";
import { getProvider } from "./auth-service";
import { getLibrary, saveLibrary } from "./cache-service";
import { getSettings } from "./settings-service";
import { LibraryItem, Library } from "../utils/schema";
import { LikedSong } from "../providers/music-provider";
import log from "electron-log/main";

function sendToRenderer(channel: string, ...args: unknown[]) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send(channel, ...args);
}

export async function syncLibrary(): Promise<Library> {
  sendToRenderer("sync:started");
  log.info("Starting library sync...");

  try {
    const provider = await getProvider();
    const rawLikedSongs = await provider.getLikedSongs();

    // Deduplicate by videoId (API pagination can return overlapping results)
    const seenVideoIds = new Set<string>();
    const likedSongs = rawLikedSongs.filter((s) => {
      if (seenVideoIds.has(s.videoId)) return false;
      seenVideoIds.add(s.videoId);
      return true;
    });

    const library = getLibrary();
    const settings = getSettings();
    const now = new Date().toISOString();

    // Build lookup of existing items by videoId
    const existingMap = new Map<string, LibraryItem>();
    for (const item of library.items) {
      existingMap.set(item.videoId, item);
    }

    // Build set of current liked videoIds
    const currentIds = new Set(likedSongs.map((s) => s.videoId));

    // Merge
    const merged: LibraryItem[] = [];

    for (const song of likedSongs) {
      const existing = existingMap.get(song.videoId);
      merged.push({
        id: song.id,
        videoId: song.videoId,
        title: song.title,
        artists: song.artists,
        album: song.album,
        durationText: song.durationText,
        durationSeconds: song.durationSeconds,
        thumbnails: song.thumbnails,
        isAvailable: song.isAvailable,
        inLibrary: true,
        // Preserve local state
        downloadStatus: existing?.downloadStatus ?? "not_downloaded",
        downloadedFile: existing?.downloadedFile ?? null,
        lastSeenAt: now,
      });
    }

    // Handle songs that were in the cache but are no longer liked
    for (const item of library.items) {
      if (!currentIds.has(item.videoId)) {
        if (settings.deleteMissingFromCache) {
          // Skip - don't add to merged
          log.info(`Removing ${item.title} from cache (no longer liked)`);
        } else {
          merged.push({
            ...item,
            inLibrary: false,
          });
        }
      }
    }

    const updated: Library = {
      version: 1,
      lastFullSyncAt: now,
      lastSyncStatus: "success",
      items: merged,
    };

    await saveLibrary(updated);
    log.info(`Sync complete: ${likedSongs.length} liked songs, ${merged.length} total in cache`);

    sendToRenderer("sync:finished", { success: true, count: merged.length });
    return updated;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Sync failed:", msg);

    // Update status but keep existing items
    try {
      const library = getLibrary();
      const failed: Library = {
        ...library,
        lastSyncStatus: "failed",
      };
      await saveLibrary(failed);
    } catch {
      // ignore
    }

    sendToRenderer("sync:finished", { success: false, error: msg });
    throw err;
  }
}
