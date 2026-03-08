<p align="center">
  <img src="repo_assets/banner.png" alt="YTM2Local Banner" width="700" />
</p>

<p align="center">
  Download your YouTube Music liked songs as local audio files.
</p>

---

## Features

- Authenticate with your YouTube Music account via OAuth
- Browse and sync your liked songs library
- Download tracks as high-quality audio (MP3/M4A via yt-dlp + ffmpeg)
- Embedded metadata and album art
- Download queue with progress tracking
- Configurable download directory and format
- Fully offline after download -- no streaming required

## Installation

Download the latest installer from [Releases](../../releases) (`.exe` for Windows, `.dmg` for macOS).

Run the installer and launch YTM2Local.

## Build from Source

**Prerequisites:** Node.js 18+, Git

```bash
git clone https://github.com/SolberLight/ytm2local
cd ytm2local
npm install
```

Download the required binaries (yt-dlp, ffmpeg, ffprobe) for your platform:

```bash
bash scripts/setup-bins.sh
```

Or place them manually in `assets/bin/` (`.exe` on Windows, no extension on macOS/Linux).

```bash
npm run build     # compile TypeScript + bundle renderer
npm run dist      # package installer with electron-builder
```

The installer (`.exe` on Windows, `.dmg` on macOS) will be output to the `release/` directory.

### Development

```bash
npm run dev       # start Vite dev server + Electron in dev mode
```

## Tech Stack

- **Electron** + **React** + **Vite** + **TypeScript**
- **youtubei.js** -- YouTube Music API client
- **yt-dlp** + **ffmpeg** -- audio downloading and conversion
- **zod** -- runtime validation
- **electron-log** -- structured logging
- **electron-builder** -- packaging and distribution

## License

[MIT](LICENSE)
