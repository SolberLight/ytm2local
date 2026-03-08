export type ElectronAPI = {
  auth: {
    status: () => Promise<{ isAuthenticated: boolean; provider: string | null }>;
    import: (cookies: string) => Promise<{ success: boolean; error?: string }>;
    browserLogin: () => Promise<{ success: boolean; error?: string }>;
    clear: () => Promise<{ success: boolean }>;
  };
  library: {
    getAll: () => Promise<Library>;
    sync: () => Promise<{ success: boolean; count?: number; error?: string }>;
  };
  downloads: {
    enqueue: (songIds: string[]) => Promise<{ success: boolean; error?: string }>;
    enqueueNew: () => Promise<{ success: boolean; error?: string }>;
    retryFailed: () => Promise<{ success: boolean; error?: string }>;
    pauseAll: () => Promise<{ success: boolean }>;
    getQueue: () => Promise<Queue>;
    getDownloads: () => Promise<Downloads>;
    openFolder: (songId?: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<Config>;
    update: (partial: Partial<Config>) => Promise<{ success: boolean; settings?: Config; error?: string }>;
    selectDownloadDir: () => Promise<string | null>;
    openAppData: () => Promise<void>;
  };
  diagnostics: {
    getLogs: () => Promise<string>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
};

export type Config = {
  version: number;
  downloadDir: string;
  audioFormat: string;
  audioQuality: string;
  filenameTemplate: string;
  downloadMode: string;
  concurrency: number;
  skipLongTracks: boolean;
  maxTrackDurationSeconds: number;
  deleteMissingFromCache: boolean;
  lastOpenedAt: string | null;
};

export type Thumbnail = {
  url: string;
  width?: number;
  height?: number;
};

export type LibraryItem = {
  id: string;
  videoId: string;
  title: string;
  artists: string[];
  album: string | null;
  durationText: string | null;
  durationSeconds: number | null;
  thumbnails: Thumbnail[];
  isAvailable: boolean;
  inLibrary: boolean;
  downloadStatus: string;
  downloadedFile: string | null;
  lastSeenAt: string;
};

export type Library = {
  version: number;
  lastFullSyncAt: string | null;
  lastSyncStatus: string;
  items: LibraryItem[];
};

export type Job = {
  id: string;
  songId: string;
  videoId: string;
  status: string;
  attempts: number;
  error: string | null;
  createdAt: string;
};

export type Queue = {
  version: number;
  active: Job[];
  pending: Job[];
  failed: Job[];
};

export type Downloads = {
  version: number;
  items: Record<string, { status: string; filePath: string; downloadedAt: string; sourceUrl: string; format: string }>;
};

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
