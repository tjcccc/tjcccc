# DEVLOG

## 2026-04-22

- Replaced the daily commit-based profile stats flow with a GitHub Pages deployment flow.
- The SVG is now generated into the Pages artifact and should be served from `https://tjcccc.github.io/profile-stats.svg`.
- `scripts/update-profile-stats.mjs` now accepts `PROFILE_STATS_OUTPUT` so the same generator can target local files or deploy artifacts.
- The Pages URL conflicted with the existing blog site, so the stats card was switched back to a repo-tracked SVG served from `raw.githubusercontent.com`.
