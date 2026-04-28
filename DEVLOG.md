# DEVLOG

## 2026-04-22

- Replaced the daily commit-based profile stats flow with a GitHub Pages deployment flow.
- The SVG is now generated into the Pages artifact and should be served from `https://tjcccc.github.io/profile-stats.svg`.
- `scripts/update-profile-stats.mjs` now accepts `PROFILE_STATS_OUTPUT` so the same generator can target local files or deploy artifacts.
- The Pages URL conflicted with the existing blog site, so the stats card was switched back to a repo-tracked SVG served from `raw.githubusercontent.com`.
- Added a Vercel-native `/profile-stats.svg` service that reuses the same generator logic and can be used instead of repo-committed SVG updates.
- Deployed the service to Vercel at `https://tjcccc-profile-stats.vercel.app`, and the profile README now points at the live Vercel SVG endpoint.
- Removed the legacy scheduled SVG snapshot flow (`.github/workflows/update-profile-stats.yml`, `assets/profile-stats.svg`, and `scripts/update-profile-stats.mjs`) so Vercel is the only stats source.
