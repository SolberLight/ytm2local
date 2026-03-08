import { BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { getSettings } from "./settings-service";
import {
  getLibrary,
  saveLibrary,
  getDownloads,
  saveDownloads,
  getQueue,
  saveQueue,
} from "./cache-service";
import { getYtDlpPath, getFfmpegPath } from "../utils/paths";
import { runProcess } from "../utils/child-process";
import { Job, LibraryItem } from "../utils/schema";
import log from "electron-log/main";

let isProcessing = false;
let abortController: AbortController | null = null;
let runGeneration = 0;

function sendToRenderer(channel: string, ...args: unknown[]) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send(channel, ...args);
}

export async function enqueueSongs(songIds: string[]): Promise<void> {
  const queue = getQueue();
  const library = getLibrary();
  const settings = getSettings();
  const now = new Date().toISOString();

  // Deduplicate
  const existingIds = new Set([
    ...queue.pending.map((j) => j.songId),
    ...queue.active.map((j) => j.songId),
  ]);

  let added = 0;
  for (const songId of songIds) {
    if (existingIds.has(songId)) continue;

    const item = library.items.find((i) => i.id === songId);
    if (!item) continue;

    // Skip long tracks if enabled
    if (settings.skipLongTracks) {
      const dur = item.durationSeconds;
      if (dur != null && dur > settings.maxTrackDurationSeconds) {
        log.info(`Skipping "${item.title}" (${dur}s exceeds ${settings.maxTrackDurationSeconds}s limit)`);
        item.downloadStatus = "skipped";
        continue;
      }
    }

    queue.pending.push({
      id: `job_${Date.now()}_${added}`,
      songId: item.id,
      videoId: item.videoId,
      status: "pending",
      attempts: 0,
      error: null,
      createdAt: now,
    });
    added++;

    // Update library item status
    item.downloadStatus = "queued";
  }

  await saveQueue(queue);
  await saveLibrary(library);

  log.info(`Enqueued ${added} songs for download`);
  sendToRenderer("download:queued", { count: added });

  kickProcessQueue();
}

export async function enqueueNewSongs(): Promise<void> {
  const library = getLibrary();
  const newSongs = library.items.filter(
    (i) => i.inLibrary && i.isAvailable && i.downloadStatus === "not_downloaded"
  );
  await enqueueSongs(newSongs.map((i) => i.id));
}

export async function retryFailed(): Promise<void> {
  const queue = getQueue();
  const library = getLibrary();

  // Move failed jobs back to pending
  for (const job of queue.failed) {
    job.status = "pending";
    job.attempts = 0;
    job.error = null;
    queue.pending.push(job);

    const item = library.items.find((i) => i.id === job.songId);
    if (item) item.downloadStatus = "queued";
  }
  queue.failed = [];

  await saveQueue(queue);
  await saveLibrary(library);

  kickProcessQueue();
}

export function kickProcessQueue(): void {
  void processQueue().catch((err) => {
    log.error("Queue processor crashed:", err);
  });
}

export function resumeQueueIfNeeded(): void {
  const settings = getSettings();
  if (!settings.autoResumeDownloads) return;

  const queue = getQueue();
  if (queue.pending.length > 0) {
    log.info(`Auto-resuming queue with ${queue.pending.length} pending downloads`);
    kickProcessQueue();
  }
}

export function pauseAll(): void {
  if (abortController) {
    abortController.abort();
  }
  runGeneration++;
  log.info("Downloads paused");
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;
  abortController = new AbortController();
  const myGeneration = ++runGeneration;

  try {
    const settings = getSettings();
    while (isProcessing) {
      const queue = getQueue();
      if (queue.pending.length === 0) break;

      // Take up to `concurrency` jobs
      const batch = queue.pending.splice(0, settings.concurrency);
      queue.active.push(...batch.map((j) => ({ ...j, status: "active" as const })));
      await saveQueue(queue);

      // Process batch in parallel
      const promises = batch.map((job) =>
        downloadSong(job, abortController!.signal)
      );
      await Promise.allSettled(promises);
    }
  } finally {
    if (myGeneration === runGeneration) {
      isProcessing = false;
      abortController = null;
    }
  }
}

async function downloadSong(
  job: Job,
  signal: AbortSignal
): Promise<void> {
  const settings = getSettings();
  const library = getLibrary();
  const downloads = getDownloads();
  const queue = getQueue();

  const item = library.items.find((i) => i.id === job.songId);
  if (!item) {
    log.warn(`Song not found for job ${job.id}, removing from active`);
    queue.active = queue.active.filter((j) => j.id !== job.id);
    await saveQueue(queue);
    sendToRenderer("download:failed", { songId: job.songId, error: "Song not found in library" });
    return;
  }

  log.info(`Downloading: ${item.title} (${item.videoId})`);
  item.downloadStatus = "downloading";
  sendToRenderer("download:started", {
    songId: job.songId,
    title: item.title,
  });

  const sourceUrl = `https://music.youtube.com/watch?v=${item.videoId}`;
  const ytDlpPath = getYtDlpPath();
  const ffmpegPath = getFfmpegPath();

  // Ensure download dir exists
  await fs.promises.mkdir(settings.downloadDir, { recursive: true });

  const args = [
    sourceUrl,
    "--extract-audio",
    "--audio-format",
    settings.audioFormat,
    "--audio-quality",
    settings.audioQuality,
    "--output",
    path.join(settings.downloadDir, settings.filenameTemplate),
    "--ffmpeg-location",
    path.dirname(ffmpegPath),
    "--no-playlist",
    "--no-overwrites",
    "--print",
    "after_move:filepath",
  ];

  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal.aborted) {
      // Paused — return job to pending without counting as failure
      item.downloadStatus = "queued";
      queue.active = queue.active.filter((j) => j.id !== job.id);
      queue.pending.unshift({ ...job, status: "pending" });
      await Promise.all([saveLibrary(library), saveQueue(queue)]);
      return;
    }

    job.attempts++;

    try {
      const { promise } = runProcess(ytDlpPath, args, {
        abortSignal: signal,
        onStderr: (line) => {
          sendToRenderer("download:progress", {
            songId: job.songId,
            line,
          });
        },
      });

      const result = await promise;

      if (result.code === 0) {
        const filePath = result.stdout.trim().split("\n").pop() || "";

        item.downloadStatus = "completed";
        item.downloadedFile = filePath;

        downloads.items[job.songId] = {
          status: "completed",
          filePath,
          downloadedAt: new Date().toISOString(),
          sourceUrl,
          format: settings.audioFormat,
        };

        // Remove from active
        queue.active = queue.active.filter((j) => j.id !== job.id);

        await Promise.all([
          saveLibrary(library),
          saveDownloads(downloads),
          saveQueue(queue),
        ]);

        log.info(`Downloaded: ${item.title} -> ${filePath}`);
        sendToRenderer("download:finished", {
          songId: job.songId,
          filePath,
        });
        return;
      }

      // If aborted mid-download, don't count as failure
      if (signal.aborted) {
        item.downloadStatus = "queued";
        queue.active = queue.active.filter((j) => j.id !== job.id);
        queue.pending.unshift({ ...job, status: "pending" });
        await Promise.all([saveLibrary(library), saveQueue(queue)]);
        return;
      }

      log.warn(
        `yt-dlp failed for ${item.videoId} (attempt ${attempt + 1}): exit ${result.code}\n${result.stderr}`
      );
    } catch (err) {
      if (signal.aborted) {
        item.downloadStatus = "queued";
        queue.active = queue.active.filter((j) => j.id !== job.id);
        queue.pending.unshift({ ...job, status: "pending" });
        await Promise.all([saveLibrary(library), saveQueue(queue)]);
        return;
      }
      log.error(`Download error for ${item.videoId} (attempt ${attempt + 1}):`, err);
    }
  }

  // All attempts failed
  item.downloadStatus = "failed";
  job.status = "failed";
  job.error = "Download failed after retries";

  queue.active = queue.active.filter((j) => j.id !== job.id);
  queue.failed.push(job);

  await Promise.all([
    saveLibrary(library),
    saveQueue(queue),
  ]);

  log.error(`Failed to download: ${item.title}`);
  sendToRenderer("download:failed", {
    songId: job.songId,
    error: job.error,
  });
}
