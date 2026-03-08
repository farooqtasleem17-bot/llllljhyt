import type { Source } from "../types/sources";

export async function extractVidoza(url: string): Promise<Source> {

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "referer": "https://vidoza.net/"
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error("Failed to fetch Vidoza page");
  }

  const html = await res.text();

  const pattern = /<source\s+src="([^"]+)"/;

  const match = html.match(pattern);

  if (!match) {
    throw new Error("Video source not found");
  }

  const videoUrl = match[1];

  return {
    sources: [
      {
        url: videoUrl,
        type: "mp4"
      }
    ]
  };
}
