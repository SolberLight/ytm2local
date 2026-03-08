import React, { useState, useEffect, useMemo } from "react";
import type { LibraryItem, Library } from "../../lib/types";

type SortKey = "title" | "artist" | "lastSeenAt";
type SortDir = "asc" | "desc";

export function LibraryView() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const loadLibrary = async () => {
    const lib = await window.api.library.getAll();
    setLibrary(lib);
  };

  useEffect(() => {
    loadLibrary();

    const unsub = window.api.on("sync:finished", () => {
      loadLibrary();
      setSyncing(false);
    });

    const unsubDl = window.api.on("download:finished", () => loadLibrary());
    const unsubFail = window.api.on("download:failed", () => loadLibrary());

    return () => { unsub(); unsubDl(); unsubFail(); };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await window.api.library.sync();
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncing(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selected.size === 0) return;
    await window.api.downloads.enqueue(Array.from(selected));
    setSelected(new Set());
    loadLibrary();
  };

  const handleDownloadNew = async () => {
    await window.api.downloads.enqueueNew();
    loadLibrary();
  };

  const filteredItems = useMemo(() => {
    if (!library) return [];

    let items = library.items;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.artists.some((a) => a.toLowerCase().includes(q)) ||
          (i.album && i.album.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      items = items.filter((i) => i.downloadStatus === statusFilter);
    }

    // Sort
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "artist")
        cmp = (a.artists[0] || "").localeCompare(b.artists[0] || "");
      else if (sortKey === "lastSeenAt")
        cmp = a.lastSeenAt.localeCompare(b.lastSeenAt);

      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [library, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredItems.map((i) => i.id)));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Library</h2>
        {library && library.lastFullSyncAt && (
          <span className="sync-info">
            Last synced: {new Date(library.lastFullSyncAt).toLocaleString()}
            {" | "}{library.items.length} songs
          </span>
        )}
      </div>

      <div className="action-bar">
        <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Likes"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleDownloadSelected}
          disabled={selected.size === 0}
        >
          Download Selected ({selected.size})
        </button>
        <button className="btn btn-secondary" onClick={handleDownloadNew}>
          Download New
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.api.downloads.openFolder()}
        >
          Open Folder
        </button>

        <input
          className="search-input"
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="not_downloaded">Not Downloaded</option>
          <option value="completed">Completed</option>
          <option value="queued">Queued</option>
          <option value="downloading">Downloading</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <table className="song-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input
                type="checkbox"
                checked={filteredItems.length > 0 && selected.size === filteredItems.length}
                onChange={toggleSelectAll}
              />
            </th>
            <th style={{ width: 50 }}></th>
            <th onClick={() => toggleSort("title")}>
              Title {sortKey === "title" ? (sortDir === "asc" ? "^" : "v") : ""}
            </th>
            <th onClick={() => toggleSort("artist")}>
              Artist {sortKey === "artist" ? (sortDir === "asc" ? "^" : "v") : ""}
            </th>
            <th>Album</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr
              key={item.id}
              className={selected.has(item.id) ? "selected" : ""}
              onClick={() => toggleSelect(item.id)}
              style={{ cursor: "pointer" }}
            >
              <td onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </td>
              <td>
                {item.thumbnails[0] && (
                  <img
                    className="song-thumb"
                    src={item.thumbnails[0].url}
                    alt=""
                    loading="lazy"
                  />
                )}
              </td>
              <td>{item.title}</td>
              <td>{item.artists.join(", ")}</td>
              <td>{item.album || "-"}</td>
              <td>{item.durationText || "-"}</td>
              <td>
                <span className={`badge badge-${item.downloadStatus}`}>
                  {item.downloadStatus.replace("_", " ")}
                </span>
              </td>
            </tr>
          ))}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                {library && library.items.length === 0
                  ? 'No songs yet. Click "Sync Likes" to fetch your library.'
                  : "No songs match your filter."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
