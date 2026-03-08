import type { Source } from "../types/sources";

export async function extractCallistanise(url: string): Promise<Source> {

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "referer": url
  };

  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error("Failed to fetch page");
  }

  const html = await res.text();

  const packedRegex =
    /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)\)\)/s;

  const match = html.match(packedRegex);

  if (!match) {
    throw new Error("Packed JavaScript not found");
  }

  const packed = match[1];
  const base = parseInt(match[2]);
  const count = parseInt(match[3]);
  const words = match[4].split("|");

  const unpacked = unpack(packed, base, count, words);

  const hls = extractHls(unpacked);

  if (!hls) {
    throw new Error("HLS URL not found");
  }

  return {
    sources: [
      {
        url: hls,
        type: "hls"
      }
    ]
  };
}

function unpack(packed: string, base: number, count: number, words: string[]) {

  let unpacked = packed;

  for (let i = 0; i < count; i++) {

    const key = i.toString(base);

    if (words[i]) {

      const regex = new RegExp(`\\b${key}\\b`, "g");
      unpacked = unpacked.replace(regex, words[i]);

    }
  }

  return unpacked;
}

function extractHls(code: string): string | null {

  const patterns = [

    /["']hls4["']\s*:\s*["'](https?:\/\/[^"']+)["']/,

    /["']hls3["']\s*:\s*["'](https?:\/\/[^"']+)["']/,

    /["']hls2["']\s*:\s*["'](https?:\/\/[^"']+)["']/,

    /["'](\/stream\/[^"']*master\.m3u8[^"']*)["']/

  ];

  for (const pattern of patterns) {

    const match = code.match(pattern);

    if (match) {
      return match[1];
    }

  }

  return null;
}
