import { spawn, ChildProcess } from "child_process";
import log from "electron-log/main";

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface ProgressCallback {
  (line: string): void;
}

export function runProcess(
  cmd: string,
  args: string[],
  options?: {
    cwd?: string;
    onStdout?: ProgressCallback;
    onStderr?: ProgressCallback;
    abortSignal?: AbortSignal;
  }
): { promise: Promise<ProcessResult>; process: ChildProcess } {
  const child = spawn(cmd, args, {
    cwd: options?.cwd,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (options?.abortSignal) {
    options.abortSignal.addEventListener("abort", () => {
      child.kill("SIGTERM");
    });
  }

  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  child.stdout.setEncoding("utf-8");
  child.stderr.setEncoding("utf-8");

  child.stdout.on("data", (data: string) => {
    stdoutChunks.push(data);
    if (options?.onStdout) {
      const lines = data.split(/\r?\n/).filter(Boolean);
      lines.forEach((line) => options.onStdout!(line));
    }
  });

  child.stderr.on("data", (data: string) => {
    stderrChunks.push(data);
    if (options?.onStderr) {
      const lines = data.split(/\r?\n/).filter(Boolean);
      lines.forEach((line) => options.onStderr!(line));
    }
  });

  const promise = new Promise<ProcessResult>((resolve, reject) => {
    child.on("error", (err) => {
      reject(err);
    });
    child.on("close", (code) => {
      resolve({
        code,
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
      });
    });
  });

  return { promise, process: child };
}
