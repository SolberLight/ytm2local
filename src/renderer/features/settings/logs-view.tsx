import React, { useState, useEffect, useRef } from "react";

export function LogsView() {
  const [logs, setLogs] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      const content = await window.api.diagnostics.getLogs();
      setLogs(content);
    } catch {
      setLogs("Failed to load logs.");
    }
    // Scroll to bottom
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Logs</h2>
        <button className="btn btn-secondary" onClick={loadLogs}>
          Refresh
        </button>
      </div>
      <div className="log-viewer" ref={containerRef}>
        {logs || "No logs yet."}
      </div>
    </div>
  );
}
