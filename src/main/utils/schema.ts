import { z } from "zod";

// --- Config ---

export const ConfigSchema = z.object({
  version: z.literal(1),
  downloadDir: z.string(),
  audioFormat: z.enum(["mp3", "opus", "m4a", "flac"]),
  audioQuality: z.string(),
  filenameTemplate: z.string(),
  downloadMode: z.enum(["new_only", "all"]),
  concurrency: z.number().int().min(1).max(8),
  skipLongTracks: z.boolean(),
  maxTrackDurationSeconds: z.number().int().min(60),
  deleteMissingFromCache: z.boolean(),
  lastOpenedAt: z.string().nullable(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DEFAULT_CONFIG: Config = {
  version: 1,
  downloadDir: "",
  audioFormat: "mp3",
  audioQuality: "192k",
  filenameTemplate: "%(artist)s - %(title)s [%(id)s].%(ext)s",
  downloadMode: "new_only",
  concurrency: 2,
  skipLongTracks: true,
  maxTrackDurationSeconds: 600,
  deleteMissingFromCache: false,
  lastOpenedAt: null,
};

// --- Auth ---

export const AuthSchema = z.object({
  version: z.literal(1),
  provider: z.string(),
  encrypted: z.boolean(),
  ciphertextBase64: z.string(),
});

export type Auth = z.infer<typeof AuthSchema>;

// --- Thumbnail ---

export const ThumbnailSchema = z.object({
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type Thumbnail = z.infer<typeof ThumbnailSchema>;

// --- Library ---

export const DownloadStatusEnum = z.enum([
  "not_downloaded",
  "queued",
  "downloading",
  "completed",
  "failed",
  "skipped",
]);

export type DownloadStatus = z.infer<typeof DownloadStatusEnum>;

export const LibraryItemSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  title: z.string(),
  artists: z.array(z.string()),
  album: z.string().nullable(),
  durationText: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  thumbnails: z.array(ThumbnailSchema),
  isAvailable: z.boolean(),
  inLibrary: z.boolean(),
  downloadStatus: DownloadStatusEnum,
  downloadedFile: z.string().nullable(),
  lastSeenAt: z.string(),
});

export type LibraryItem = z.infer<typeof LibraryItemSchema>;

export const LibrarySchema = z.object({
  version: z.literal(1),
  lastFullSyncAt: z.string().nullable(),
  lastSyncStatus: z.enum(["success", "failed", "never"]),
  items: z.array(LibraryItemSchema),
});

export type Library = z.infer<typeof LibrarySchema>;

export const DEFAULT_LIBRARY: Library = {
  version: 1,
  lastFullSyncAt: null,
  lastSyncStatus: "never",
  items: [],
};

// --- Downloads ---

export const DownloadRecordSchema = z.object({
  status: z.string(),
  filePath: z.string(),
  downloadedAt: z.string(),
  sourceUrl: z.string(),
  format: z.string(),
});

export type DownloadRecord = z.infer<typeof DownloadRecordSchema>;

export const DownloadsSchema = z.object({
  version: z.literal(1),
  items: z.record(z.string(), DownloadRecordSchema),
});

export type Downloads = z.infer<typeof DownloadsSchema>;

export const DEFAULT_DOWNLOADS: Downloads = {
  version: 1,
  items: {},
};

// --- Queue ---

export const JobSchema = z.object({
  id: z.string(),
  songId: z.string(),
  videoId: z.string(),
  status: z.enum(["pending", "active", "completed", "failed"]),
  attempts: z.number().int(),
  error: z.string().nullable(),
  createdAt: z.string(),
});

export type Job = z.infer<typeof JobSchema>;

export const QueueSchema = z.object({
  version: z.literal(1),
  active: z.array(JobSchema),
  pending: z.array(JobSchema),
  failed: z.array(JobSchema),
});

export type Queue = z.infer<typeof QueueSchema>;

export const DEFAULT_QUEUE: Queue = {
  version: 1,
  active: [],
  pending: [],
  failed: [],
};
