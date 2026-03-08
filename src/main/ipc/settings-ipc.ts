import { ipcMain, dialog, shell } from "electron";
import { getSettings, updateSettings } from "../services/settings-service";
import { getLogContents } from "../services/log-service";
import { getUserDataPath } from "../utils/paths";
import type { Config } from "../utils/schema";
import log from "electron-log/main";

export function registerSettingsIpc(): void {
  ipcMain.handle("settings:get", async () => {
    return getSettings();
  });

  ipcMain.handle("settings:update", async (_event, partial: Partial<Config>) => {
    try {
      const updated = await updateSettings(partial);
      return { success: true, settings: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error("settings:update error:", msg);
      return { success: false, error: msg };
    }
  });

  ipcMain.handle("settings:selectDownloadDir", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Download Folder",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle("settings:openAppData", async () => {
    const err = await shell.openPath(getUserDataPath());
    if (err) throw new Error(err);
  });

  ipcMain.handle("diagnostics:getLogs", async () => {
    return getLogContents();
  });
}
