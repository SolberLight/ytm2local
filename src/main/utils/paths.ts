import { app } from "electron";
import path from "path";

export function getUserDataPath(): string {
  return app.getPath("userData");
}

export function getConfigPath(): string {
  return path.join(getUserDataPath(), "config.json");
}

export function getAuthPath(): string {
  return path.join(getUserDataPath(), "auth.json");
}

export function getLibraryPath(): string {
  return path.join(getUserDataPath(), "library.json");
}

export function getDownloadsPath(): string {
  return path.join(getUserDataPath(), "downloads.json");
}

export function getQueuePath(): string {
  return path.join(getUserDataPath(), "queue.json");
}

export function getLogsDir(): string {
  return path.join(getUserDataPath(), "logs");
}

export function getTmpDir(): string {
  return path.join(getUserDataPath(), "tmp");
}

export function getBinDir(): string {
  // In dev, use assets/bin. In production, use resources/bin.
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "bin");
  }
  return path.join(app.getAppPath(), "assets", "bin");
}

function getBinaryName(baseName: string): string {
  return process.platform === "win32" ? `${baseName}.exe` : baseName;
}

export function getYtDlpPath(): string {
  return path.join(getBinDir(), getBinaryName("yt-dlp"));
}

export function getFfmpegPath(): string {
  return path.join(getBinDir(), getBinaryName("ffmpeg"));
}
