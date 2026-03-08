import React, { useState, useEffect, useRef } from "react";
import type { Queue, Library, Downloads } from "../../lib/types";

const MAX_VISIBLE = 10;

export function DownloadsView() {
  const [queue, setQueue] = useState<Queue | null>(null);
  const [library, setLibrary] = useState<Library | null>(null);
  const [downloads, setDownloads] = useState<Downloads | null>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});

  const activeRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef<HTMLDivElement>(null);
  const failedRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const [q, lib, dl] = await Promise.all([
        window.api.downloads.getQueue(),
        window.api.library.getAll(),
        window.api.downloads.getDownloads(),
      ]);
      setQueue(q);
      setLibrary(lib);
      setDownloads(dl);
    } catch (err) {
      console.error("Failed to load download queue:", err);
    }
  };

  useEffect(() => {
    load();

    const unsubs = [
      window.api.on("download:queued", () => { void load(); }),
      window.api.on("download:started", () => { void load(); }),
      window.api.on("download:finished", () => { void load(); }),
      window.api.on("download:failed", () => { void load(); }),
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

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Build completed list from downloads store
  const completedItems = downloads
    ? Object.entries(downloads.items)
        .filter(([, r]) => r.status === "completed")
        .sort(([, a], [, b]) => b.downloadedAt.localeCompare(a.downloadedAt))
    : [];

  const activeCount = queue?.active.length ?? 0;
  const pendingCount = queue?.pending.length ?? 0;
  const failedCount = queue?.failed.length ?? 0;
  const completedCount = completedItems.length;

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
        <div className="action-bar" style={{ gap: 6 }}>
          {activeCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={() => scrollTo(activeRef)}>
              Active ({activeCount})
            </button>
          )}
          {pendingCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={() => scrollTo(pendingRef)}>
              Queue ({pendingCount})
            </button>
          )}
          {completedCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={() => scrollTo(completedRef)}>
              Downloaded ({completedCount})
            </button>
          )}
          {failedCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={() => scrollTo(failedRef)}>
              Failed ({failedCount})
            </button>
          )}
        </div>
      )}

      {queue && (
        <>
          {activeCount > 0 && (
            <div className="queue-section" ref={activeRef}>
              <h3>Active ({activeCount})</h3>
              {queue.active.slice(0, MAX_VISIBLE).map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-downloading">
                    {progress[job.songId] || "downloading..."}
                  </span>
                </div>
              ))}
              {activeCount > MAX_VISIBLE && (
                <div className="queue-more">and {activeCount - MAX_VISIBLE} more...</div>
              )}
            </div>
          )}

          {pendingCount > 0 && (
            <div className="queue-section" ref={pendingRef}>
              <h3>Queue ({pendingCount})</h3>
              {queue.pending.slice(0, MAX_VISIBLE).map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-queued">queued</span>
                </div>
              ))}
              {pendingCount > MAX_VISIBLE && (
                <div className="queue-more">and {pendingCount - MAX_VISIBLE} more...</div>
              )}
            </div>
          )}

          {completedCount > 0 && (
            <div className="queue-section" ref={completedRef}>
              <h3>Downloaded ({completedCount})</h3>
              {completedItems.slice(0, MAX_VISIBLE).map(([songId, record]) => {
                const item = library?.items.find((i) => i.id === songId);
                return (
                  <div className="queue-item" key={songId}>
                    <span>{item?.title || songId}</span>
                    <span className="badge badge-completed">{record.format}</span>
                  </div>
                );
              })}
              {completedCount > MAX_VISIBLE && (
                <div className="queue-more">and {completedCount - MAX_VISIBLE} more...</div>
              )}
            </div>
          )}

          {failedCount > 0 && (
            <div className="queue-section" ref={failedRef}>
              <h3>Failed ({failedCount})</h3>
              {queue.failed.slice(0, MAX_VISIBLE).map((job) => (
                <div className="queue-item" key={job.id}>
                  <span>{songTitle(job.songId)}</span>
                  <span className="badge badge-failed">{job.error || "failed"}</span>
                </div>
              ))}
              {failedCount > MAX_VISIBLE && (
                <div className="queue-more">and {failedCount - MAX_VISIBLE} more...</div>
              )}
            </div>
          )}

          {activeCount === 0 &&
            pendingCount === 0 &&
            completedCount === 0 &&
            failedCount === 0 && (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: 40 }}>
                No downloads in queue. Go to Library to start downloading songs.
              </p>
            )}
        </>
      )}
    </div>
  );
}
