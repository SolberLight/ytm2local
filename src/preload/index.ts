import { contextBridge, ipcRenderer } from "electron";

const api = {
  auth: {
    status: () => ipcRenderer.invoke("auth:status"),
    import: (cookies: string) => ipcRenderer.invoke("auth:import", cookies),
    browserLogin: () => ipcRenderer.invoke("auth:browserLogin"),
    clear: () => ipcRenderer.invoke("auth:clear"),
  },
  library: {
    getAll: () => ipcRenderer.invoke("library:getAll"),
    sync: () => ipcRenderer.invoke("library:sync"),
  },
  downloads: {
    enqueue: (songIds: string[]) =>
      ipcRenderer.invoke("downloads:enqueue", songIds),
    enqueueNew: () => ipcRenderer.invoke("downloads:enqueueNew"),
    retryFailed: () => ipcRenderer.invoke("downloads:retryFailed"),
    pauseAll: () => ipcRenderer.invoke("downloads:pauseAll"),
    getQueue: () => ipcRenderer.invoke("downloads:getQueue"),
    getDownloads: () => ipcRenderer.invoke("downloads:getDownloads"),
    openFolder: (songId?: string) =>
      ipcRenderer.invoke("downloads:openFolder", songId),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (partial: Record<string, unknown>) =>
      ipcRenderer.invoke("settings:update", partial),
    selectDownloadDir: () => ipcRenderer.invoke("settings:selectDownloadDir"),
    openAppData: () => ipcRenderer.invoke("settings:openAppData"),
  },
  diagnostics: {
    getLogs: () => ipcRenderer.invoke("diagnostics:getLogs"),
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      "sync:started",
      "sync:progress",
      "sync:finished",
      "download:queued",
      "download:started",
      "download:progress",
      "download:finished",
      "download:failed",
    ];
    if (validChannels.includes(channel)) {
      const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
    return () => {};
  },
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
