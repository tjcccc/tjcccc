#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";

const USERNAME = process.env.PROFILE_USERNAME || "tjcccc";
const DISPLAY_NAME = process.env.PROFILE_DISPLAY_NAME || "seesaw game";
const OUT_DIR = new URL("../assets/", import.meta.url);
const API_ROOT = "https://api.github.com";

const requestHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USERNAME}-profile-stats`,
  "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GITHUB_TOKEN) {
  requestHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function githubJson(path) {
  const response = await fetch(`${API_ROOT}${path}`, { headers: requestHeaders });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${body}`);
  }

  return response.json();
}

async function githubJsonPages(path) {
  const results = [];
  let page = 1;

  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const rows = await githubJson(`${path}${separator}per_page=100&page=${page}`);
    results.push(...rows);

    if (rows.length < 100) {
      return results;
    }

    page += 1;
  }
}

function compactNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function progressWidth(value, maxValue, maxWidth) {
  if (maxValue <= 0) {
    return 0;
  }

  return Math.max(4, Math.round((value / maxValue) * maxWidth));
}

function combinedCard(user, repos, languageTotals) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const languages = Object.entries(languageTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const languageTotal = languages.reduce((sum, [, bytes]) => sum + bytes, 0);
  const maxLanguageBytes = Math.max(...languages.map(([, bytes]) => bytes), 1);

  const title = `${DISPLAY_NAME}'s GitHub stats`;
  const stats = [
    ["Public repos", user.public_repos],
    ["Stars received", totalStars],
    ["Forks received", totalForks],
    ["Followers", user.followers],
    ["Following", user.following],
  ];

  const statRows = stats
    .map(([label, value], index) => {
      const y = 78 + index * 31;

      return `  <text x="38" y="${y}" class="muted small">${escapeXml(label)}</text>
  <text x="294" y="${y}" class="strong value" text-anchor="end">${compactNumber(value)}</text>`;
    })
    .join("\n");

  const languageColors = ["#0969DA", "#1A7F37", "#CF222E", "#9A6700", "#8250DF", "#1B7C83"];
  const languageRows = languages
    .map(([language, bytes], index) => {
      const y = 78 + index * 26;
      const percent = languageTotal > 0 ? (bytes / languageTotal) * 100 : 0;
      const width = progressWidth(bytes, maxLanguageBytes, 170);
      const color = languageColors[index % languageColors.length];

      return `  <circle cx="450" cy="${y - 5}" r="5" fill="${color}"/>
  <text x="466" y="${y}" class="muted small">${escapeXml(language)}</text>
  <rect x="590" y="${y - 14}" width="170" height="8" rx="4" class="bar-bg"/>
  <rect x="590" y="${y - 14}" width="${width}" height="8" rx="4" fill="${color}"/>
  <text x="844" y="${y}" class="strong percent" text-anchor="end">${percent.toFixed(1)}%</text>`;
    })
    .join("\n");

  const languageEmptyState = `  <text x="450" y="86" class="muted small">No public repository language data found.</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="880" height="245" viewBox="0 0 880 245" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">Public GitHub profile statistics and top languages generated from the GitHub API.</desc>
  <style>
    .card { fill: #ffffff; }
    .border { stroke: #d0d7de; }
    .divider { stroke: #d8dee4; }
    .title { fill: #24292f; font: 700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .section { fill: #24292f; font: 700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .muted { fill: #57606a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .strong { fill: #24292f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .small { font-size: 14px; }
    .value { font-size: 16px; font-weight: 700; }
    .percent { font-size: 13px; font-weight: 700; }
    .bar-bg { fill: #eaeef2; }

    @media (prefers-color-scheme: dark) {
      .card { fill: #0d1117; }
      .border { stroke: #30363d; }
      .divider { stroke: #30363d; }
      .title { fill: #f0f6fc; }
      .section { fill: #f0f6fc; }
      .muted { fill: #8b949e; }
      .strong { fill: #f0f6fc; }
      .bar-bg { fill: #21262d; }
    }
  </style>
  <rect width="880" height="245" rx="8" class="card"/>
  <rect x="0.5" y="0.5" width="879" height="244" rx="7.5" class="border"/>
  <text x="32" y="43" class="title">${escapeXml(title)}</text>
  <line x1="410" y1="62" x2="410" y2="210" class="divider"/>
${statRows}
${languageRows || languageEmptyState}
</svg>
`;
}

async function main() {
  const [user, repos] = await Promise.all([
    githubJson(`/${["users", USERNAME].join("/")}`),
    githubJsonPages(`/${["users", USERNAME, "repos"].join("/")}?type=owner&sort=updated&direction=desc`),
  ]);

  const sourceRepos = repos.filter((repo) => !repo.fork && !repo.archived && repo.languages_url);
  const languageResponses = await Promise.all(sourceRepos.map((repo) => githubJson(repo.languages_url.replace(API_ROOT, ""))));
  const languageTotals = {};

  for (const languages of languageResponses) {
    for (const [language, bytes] of Object.entries(languages)) {
      languageTotals[language] = (languageTotals[language] || 0) + bytes;
    }
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(new URL("profile-stats.svg", OUT_DIR), combinedCard(user, repos, languageTotals), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
