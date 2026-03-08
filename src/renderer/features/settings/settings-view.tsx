import React, { useState, useEffect } from "react";
import type { Config } from "../../lib/types";

interface Props {
  onLogout: () => void;
}

export function SettingsView({ onLogout }: Props) {
  const [config, setConfig] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.api.settings.get().then(setConfig);
  }, []);

  const update = async (partial: Partial<Config>) => {
    const result = await window.api.settings.update(partial);
    if (result.success && result.settings) {
      setConfig(result.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSelectDir = async () => {
    const dir = await window.api.settings.selectDownloadDir();
    if (dir) update({ downloadDir: dir });
  };

  const handleClearAccount = async () => {
    await window.api.auth.clear();
    onLogout();
  };

  if (!config) return <p>Loading settings...</p>;

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        {saved && <span style={{ color: "var(--success)", fontSize: 13 }}>Saved</span>}
      </div>

      <div className="settings-grid">
        <div className="settings-group">
          <h3>Downloads</h3>
          <div className="settings-row">
            <label>Download Folder</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="settings-input"
                value={config.downloadDir}
                readOnly
                style={{ width: 220 }}
              />
              <button className="btn btn-sm btn-secondary" onClick={handleSelectDir}>
                Browse
              </button>
            </div>
          </div>
          <div className="settings-row">
            <label>Audio Format</label>
            <select
              className="filter-select"
              value={config.audioFormat}
              onChange={(e) => update({ audioFormat: e.target.value })}
            >
              <option value="mp3">MP3</option>
              <option value="opus">Opus</option>
              <option value="m4a">M4A</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
          <div className="settings-row">
            <label>Audio Quality</label>
            <input
              className="settings-input"
              value={config.audioQuality}
              onChange={(e) => update({ audioQuality: e.target.value })}
              style={{ width: 100 }}
            />
          </div>
          <div className="settings-row">
            <label>Filename Template</label>
            <input
              className="settings-input"
              value={config.filenameTemplate}
              onChange={(e) => update({ filenameTemplate: e.target.value })}
            />
          </div>
          <div className="settings-row">
            <label>Concurrency</label>
            <input
              className="settings-input"
              type="number"
              min={1}
              max={8}
              value={config.concurrency}
              onChange={(e) => update({ concurrency: parseInt(e.target.value) || 2 })}
              style={{ width: 60 }}
            />
          </div>
          <div className="settings-row">
            <label>Skip tracks longer than</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={config.skipLongTracks}
                onChange={(e) => update({ skipLongTracks: e.target.checked })}
              />
              <input
                className="settings-input"
                type="number"
                min={1}
                value={Math.floor(config.maxTrackDurationSeconds / 60)}
                onChange={(e) => update({ maxTrackDurationSeconds: (parseInt(e.target.value) || 10) * 60 })}
                disabled={!config.skipLongTracks}
                style={{ width: 60 }}
              />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>minutes</span>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3>Sync</h3>
          <div className="settings-row">
            <label>Remove unliked songs from cache</label>
            <input
              type="checkbox"
              checked={config.deleteMissingFromCache}
              onChange={(e) => update({ deleteMissingFromCache: e.target.checked })}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Account</h3>
          <div className="settings-row">
            <label>Clear account data and sign out</label>
            <button className="btn btn-sm btn-danger" onClick={handleClearAccount}>
              Clear Account
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h3>Advanced</h3>
          <div className="settings-row">
            <label>Open app data folder</label>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => window.api.settings.openAppData()}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
