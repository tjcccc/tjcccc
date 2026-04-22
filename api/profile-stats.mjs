import { generateProfileStatsSvg } from "../lib/profile-stats.mjs";

export default {
  async fetch() {
    try {
      const svg = await generateProfileStatsSvg();

      return new Response(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    } catch (error) {
      return new Response(`Profile stats generation failed: ${error.message}`, {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
  },
};
