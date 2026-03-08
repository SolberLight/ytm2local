import React, { useState, useEffect } from "react";
import { AuthPage } from "./features/auth/auth-page";
import { LibraryView } from "./features/library/library-view";
import { DownloadsView } from "./features/downloads/downloads-view";
import { SettingsView } from "./features/settings/settings-view";
import { LogsView } from "./features/settings/logs-view";

type Page = "library" | "downloads" | "settings" | "logs";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("library");

  useEffect(() => {
    window.api.auth.status().then((status) => {
      setIsAuthenticated(status.isAuthenticated);
    });
  }, []);

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
