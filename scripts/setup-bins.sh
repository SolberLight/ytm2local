#!/usr/bin/env bash
set -euo pipefail

BIN_DIR="$(cd "$(dirname "$0")/../assets/bin" 2>/dev/null || mkdir -p "$(dirname "$0")/../assets/bin" && cd "$(dirname "$0")/../assets/bin" && pwd)"

mkdir -p "$BIN_DIR"

PLATFORM="$(uname -s)"

case "$PLATFORM" in
  Darwin)
    echo "Detected macOS"

    if [ ! -f "$BIN_DIR/yt-dlp" ]; then
      echo "Downloading yt-dlp (macOS universal)..."
      curl -L -o "$BIN_DIR/yt-dlp" https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos
      chmod +x "$BIN_DIR/yt-dlp"
    else
      echo "yt-dlp already exists, skipping"
    fi

    if [ ! -f "$BIN_DIR/ffmpeg" ]; then
      echo "Downloading ffmpeg (macOS)..."
      curl -L -o "$BIN_DIR/ffmpeg.zip" https://evermeet.cx/ffmpeg/getrelease/zip
      unzip -o "$BIN_DIR/ffmpeg.zip" -d "$BIN_DIR"
      rm -f "$BIN_DIR/ffmpeg.zip"
      chmod +x "$BIN_DIR/ffmpeg"
    else
      echo "ffmpeg already exists, skipping"
    fi

    if [ ! -f "$BIN_DIR/ffprobe" ]; then
      echo "Downloading ffprobe (macOS)..."
      curl -L -o "$BIN_DIR/ffprobe.zip" https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip
      unzip -o "$BIN_DIR/ffprobe.zip" -d "$BIN_DIR"
      rm -f "$BIN_DIR/ffprobe.zip"
      chmod +x "$BIN_DIR/ffprobe"
    else
      echo "ffprobe already exists, skipping"
    fi
    ;;

  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    echo "Detected Windows"

    if [ ! -f "$BIN_DIR/yt-dlp.exe" ]; then
      echo "Downloading yt-dlp (Windows)..."
      curl -L -o "$BIN_DIR/yt-dlp.exe" https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
    else
      echo "yt-dlp.exe already exists, skipping"
    fi

    if [ ! -f "$BIN_DIR/ffmpeg.exe" ]; then
      echo "Downloading ffmpeg (Windows)..."
      curl -L -o /tmp/ffmpeg.zip https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
      unzip -o /tmp/ffmpeg.zip -d /tmp
      cp /tmp/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe "$BIN_DIR/ffmpeg.exe"
      cp /tmp/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe "$BIN_DIR/ffprobe.exe"
      rm -rf /tmp/ffmpeg.zip /tmp/ffmpeg-master-latest-win64-gpl
    else
      echo "ffmpeg.exe already exists, skipping"
    fi
    ;;

  Linux)
    echo "Detected Linux"

    if [ ! -f "$BIN_DIR/yt-dlp" ]; then
      echo "Downloading yt-dlp (Linux)..."
      curl -L -o "$BIN_DIR/yt-dlp" https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp
      chmod +x "$BIN_DIR/yt-dlp"
    else
      echo "yt-dlp already exists, skipping"
    fi

    if [ ! -f "$BIN_DIR/ffmpeg" ]; then
      echo "Please install ffmpeg via your package manager (e.g. apt install ffmpeg)"
      exit 1
    else
      echo "ffmpeg already exists, skipping"
    fi
    ;;

  *)
    echo "Unsupported platform: $PLATFORM"
    exit 1
    ;;
esac

echo ""
echo "Binaries ready in $BIN_DIR:"
ls -la "$BIN_DIR"
