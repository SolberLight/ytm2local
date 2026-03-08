import { app } from "electron";
import path from "path";
import { Config, ConfigSchema, DEFAULT_CONFIG } from "../utils/schema";
import { loadJson, saveJsonAtomic } from "../utils/json-store";
import { getConfigPath } from "../utils/paths";
import log from "electron-log/main";

let cachedConfig: Config | null = null;

export async function loadSettings(): Promise<Config> {
  const config = await loadJson(getConfigPath(), ConfigSchema, {
    ...DEFAULT_CONFIG,
    downloadDir: path.join(app.getPath("music"), "YouTube Music"),
  });
  cachedConfig = config;
  return config;
}

export function getSettings(): Config {
  if (!cachedConfig) {
    throw new Error("Settings not loaded yet. Call loadSettings() first.");
  }
  return cachedConfig;
}

export async function updateSettings(
  partial: Partial<Config>
): Promise<Config> {
  const current = getSettings();
  const updated: Config = { ...current, ...partial, version: 1 };

  const result = ConfigSchema.safeParse(updated);
  if (!result.success) {
    throw new Error(`Invalid settings: ${result.error.message}`);
  }

  cachedConfig = result.data;
  await saveJsonAtomic(getConfigPath(), cachedConfig);
  log.info("Settings updated");
  return cachedConfig;
}
