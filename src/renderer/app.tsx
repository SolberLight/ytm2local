import React, { useState, useEffect, useCallback } from "react";
import { AuthPage } from "./features/auth/auth-page";
import { LibraryView } from "./features/library/library-view";
import { DownloadsView } from "./features/downloads/downloads-view";
import { SettingsView } from "./features/settings/settings-view";
import { LogsView } from "./features/settings/logs-view";

type Page = "library" | "downloads" | "settings" | "logs";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("library");
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const loadCounts = useCallback(async () => {
    try {
      const [q, dl] = await Promise.all([
        window.api.downloads.getQueue(),
        window.api.downloads.getDownloads(),
      ]);
      const completed = Object.values(dl.items).filter(
        (r) => r.status === "completed"
      ).length;
      setDownloadedCount(completed);
      setFailedCount(q.failed.length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    window.api.auth
      .status()
      .then((status) => {
        setIsAuthenticated(status.isAuthenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    loadCounts();

    const unsubs = [
      window.api.on("download:finished", () => { void loadCounts(); }),
      window.api.on("download:failed", () => { void loadCounts(); }),
      window.api.on("download:queued", () => { void loadCounts(); }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [loadCounts]);

  if (isAuthenticated === null) {
    return <div className="auth-page"><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-title">YTM2Local</div>
        <div className="sidebar-nav">
          <button
            className={`sidebar-link ${currentPage === "library" ? "active" : ""}`}
            onClick={() => setCurrentPage("library")}
          >
            Library
          </button>
          <button
            className={`sidebar-link ${currentPage === "downloads" ? "active" : ""}`}
            onClick={() => setCurrentPage("downloads")}
          >
            Downloads
            {(downloadedCount > 0 || failedCount > 0) && (
              <span className="sidebar-counts">
                {downloadedCount > 0 && (
                  <span className="sidebar-badge sidebar-badge-completed">{downloadedCount}</span>
                )}
                {failedCount > 0 && (
                  <span className="sidebar-badge sidebar-badge-failed">{failedCount}</span>
                )}
              </span>
            )}
          </button>
          <button
            className={`sidebar-link ${currentPage === "settings" ? "active" : ""}`}
            onClick={() => setCurrentPage("settings")}
          >
            Settings
          </button>
          <button
            className={`sidebar-link ${currentPage === "logs" ? "active" : ""}`}
            onClick={() => setCurrentPage("logs")}
          >
            Logs
          </button>
        </div>
      </nav>
      <div className="main-content">
        {currentPage === "library" && <LibraryView />}
        {currentPage === "downloads" && <DownloadsView />}
        {currentPage === "settings" && (
          <SettingsView onLogout={() => setIsAuthenticated(false)} />
        )}
        {currentPage === "logs" && <LogsView />}
      </div>
    </div>
  );
}
