# Changelog

## [0.0.4] - 2026-03-08

### Fixed
- Library search/filter returning wrong results due to duplicate React keys
- Duplicate songs appearing in library from YouTube Music API pagination overlap
- Deduplicate liked songs by videoId during sync

### Added
- Pagination on library table (50 songs per page) for better performance
- Sticky pagination bar with First/Prev/Next/Last navigation and item count
- Select-all checkbox now operates on current page only

### Changed
- `/pr` skill now always bumps version and updates changelog before creating PR

## [0.0.3] - 2026-03-08

### Added
- Theme skin system with 6 switchable UI skins (Default, Midnight Ember, Cyber Neon, Aurora Borealis, Vinyl Noir, Tokyo Sakura)
- Visual skin picker in Settings with live preview cards
- ThemeContext with CSS variable injection and per-theme custom CSS
- Theme selection persisted in localStorage
- Each skin transforms colors, typography, borders, animations, shadows, and effects

### Changed
- Midnight Ember is now the default theme
- Settings grid max-width increased to 700px for skin picker layout

## [0.0.2] - 2026-03-08

### Fixed
- Release workflow quoting for Windows Git Bash runners
- App icon resized to 256x256 (electron-builder requirement)
- Added `--publish never` to dist script
- pauseAll/processQueue race condition via generation counter
- Login window reject-after-resolve with settled flag
- saveLibrary now uses correct local reference in enqueueSongs
- Restored concurrent downloads (removed unnecessary clamp)
- Use `import type` for Config in settings-ipc

## [0.0.1] - 2026-03-08

### Added
- Electron + React + Vite + TypeScript app scaffold
- YouTube Music OAuth authentication via youtubei.js
- Library sync and browsing
- Audio download with yt-dlp + ffmpeg (MP3/M4A)
- Download queue with progress tracking
- Settings management (download dir, format, concurrency)
- Custom app icon and branding
- GitHub Actions CI/CD (build on PR, release on main merge)
