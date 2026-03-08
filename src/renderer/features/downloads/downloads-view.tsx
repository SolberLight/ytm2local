import React, { useState, useEffect } from "react";
import type { Queue, Library } from "../../lib/types";

export function DownloadsView() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [library, setLibrary] = useState<Library | null>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});

  const load = async () => {
    const [q, lib] = await Promise.all([
      window.api.downloads.getQueue(),
      window.api.library.getAll(),
    ]);
    setQueue(q);
    setLibrary(lib);
  };

  useEffect(() => {
    load();

    const unsubs = [
      window.api.on("download:queued", load),
      window.api.on("download:started", load),
      window.api.on("download:finished", load),
      window.api.on("download:failed", load),
      window.api.on("download:progress", (data: unknown) => {
        const d = data as { songId: string; line: string };
        setProgress((prev) => ({ ...prev, [d.songId]: d.line }));
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const songTitle = (songId: string) => {
    return library?.items.find((i) => i.id === songId)?.title || songId;
  };

  return (
    <div>
      <div className="page-header">
        <h2>Downloads</h2>
      </div>

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={() => window.api.downloads.enqueueNew()}>
          Download New
        </button>
        <button className="btn btn-secondary" onClick={async () => { await window.api.downloads.retryFailed(); load(); }}>
          Retry Failed
        </button>
        <button className="btn btn-secondary" onClick={() => window.api.downloads.pauseAll()}>
          Pause All
        </button>
        <button className="btn btn-secondary" onClick={() => window.api.downloads.openFolder()}>
          Open Folder
        </button>
      </div>

      {queue && (
        <>
          {queue.active.length > 0 && (
            <div className="queue-section">
              <h3>Active ({queue.active.length})</h3>
              {queue.active.map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-downloading">
                    {progress[job.songId] || "downloading..."}
                  </span>
                </div>
              ))}
            </div>
          )}

          {queue.pending.length > 0 && (
            <div className="queue-section">
              <h3>Pending ({queue.pending.length})</h3>
              {queue.pending.map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-queued">queued</span>
                </div>
              ))}
            </div>
          )}

          {queue.failed.length > 0 && (
            <div className="queue-section">
              <h3>Failed ({queue.failed.length})</h3>
              {queue.failed.map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-failed">{job.error || "failed"}</span>
                </div>
              ))}
            </div>
          )}

          {queue.active.length === 0 &&
            queue.pending.length === 0 &&
            queue.failed.length === 0 && (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 40 }}>
                No downloads in queue. Go to Library to start downloading songs.
              </p>
            )}
        </>
      )}
    </div>
  );
}
