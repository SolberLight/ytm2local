import { ipcMain, shell } from "electron";
import {
  enqueueSongs,
  enqueueNewSongs,
  retryFailed,
  pauseAll,
} from "../services/download-service";
import { getQueue, getDownloads } from "../services/cache-service";
import { getSettings } from "../services/settings-service";
import path from "path";
import log from "electron-log/main";

export function registerDownloadsIpc(): void {
  ipcMain.handle("downloads:enqueue", async (_event, songIds: string[]) => {
    try {
      await enqueueSongs(songIds);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("downloads:enqueue error:", msg);
      return { success: false, error: msg };
    }
  });

  ipcMain.handle("downloads:enqueueNew", async () => {
    try {
      await enqueueNewSongs();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("downloads:enqueueNew error:", msg);
      return { success: false, error: msg };
    }
  });

  ipcMain.handle("downloads:retryFailed", async () => {
    try {
      await retryFailed();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("downloads:retryFailed error:", msg);
      return { success: false, error: msg };
    }
  });

  ipcMain.handle("downloads:pauseAll", async () => {
    pauseAll();
    return { success: true };
  });

  ipcMain.handle("downloads:getQueue", async () => {
    return getQueue();
  });

  ipcMain.handle("downloads:getDownloads", async () => {
    return getDownloads();
  });

  ipcMain.handle("downloads:openFolder", async (_event, songId?: string) => {
    const settings = getSettings();
    if (songId) {
      const downloads = getDownloads();
      const record = downloads.items[songId];
      if (record?.filePath) {
        shell.showItemInFolder(record.filePath);
        return;
      }
    }
    shell.openPath(settings.downloadDir);
  });
}
