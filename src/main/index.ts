import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { initLogger } from "./services/log-service";
import { loadSettings, updateSettings } from "./services/settings-service";
import { loadLibrary, loadDownloads, loadQueue } from "./services/cache-service";
import { registerAuthIpc } from "./ipc/auth-ipc";
import { registerLibraryIpc } from "./ipc/library-ipc";
import { registerDownloadsIpc } from "./ipc/downloads-ipc";
import { registerSettingsIpc } from "./ipc/settings-ipc";
import log from "electron-log/main";

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

async function createWindow(): Promise<void> {
  Menu.setApplicationMenu(null);

  const iconPath = isDev
    ? path.join(__dirname, "..", "..", "repo_assets", "icon.png")
    : path.join(process.resourcesPath, "icon.png");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    title: "YTM2Local",
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, "..", "renderer", "index.html")
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function bootstrap(): Promise<void> {
  initLogger();
  log.info("App starting...");

  // Load all JSON stores
  await loadSettings();
  await loadLibrary();
  await loadDownloads();
  await loadQueue();

  // Update lastOpenedAt
  await updateSettings({ lastOpenedAt: new Date().toISOString() });

  // Register IPC handlers
  registerAuthIpc();
  registerLibraryIpc();
  registerDownloadsIpc();
  registerSettingsIpc();

  log.info("Bootstrap complete");
}

app.whenReady().then(async () => {
  await bootstrap();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
