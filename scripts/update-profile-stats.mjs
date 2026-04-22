#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateProfileStatsSvg } from "../lib/profile-stats.mjs";

const DEFAULT_OUTPUT_PATH = fileURLToPath(new URL("../assets/profile-stats.svg", import.meta.url));
const OUTPUT_PATH = path.resolve(process.cwd(), process.env.PROFILE_STATS_OUTPUT || DEFAULT_OUTPUT_PATH);

async function main() {
  const svg = await generateProfileStatsSvg();
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, svg, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
