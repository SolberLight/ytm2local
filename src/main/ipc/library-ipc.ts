import { ipcMain } from "electron";
import { getLibrary } from "../services/cache-service";
import { syncLibrary } from "../services/sync-service";
import log from "electron-log/main";

export function registerLibraryIpc(): void {
  ipcMain.handle("library:getAll", async () => {
    try {
      return getLibrary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("library:getAll error:", msg);
      return { version: 1, lastFullSyncAt: null, lastSyncStatus: "never", items: [] };
    }
  });

  ipcMain.handle("library:sync", async () => {
    try {
      const result = await syncLibrary();
      return { success: true, count: result.items.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  });
}
