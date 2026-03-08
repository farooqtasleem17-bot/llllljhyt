export async function extractCallistanise(url: string) {

  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "referer": url
  };

  const res = await fetch(url, { headers });
  const html = await res.text();

  const packedRegex =
    /eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.*?)',(\d+),(\d+),'(.*?)'\.split\('\|'\)\)\)/s;

  const match = html.match(packedRegex);

  if (!match) {
    throw new Error("Packed JS not found");
  }

  const packed = match[1];
  const base = parseInt(match[2]);
  const count = parseInt(match[3]);
  const words = match[4].split("|");

  const unpacked = unpack(packed, base, count, words);

  const hls = extractHls(unpacked);

  if (!hls) {
    throw new Error("HLS not found");
  }

  return {
    source: hls,
    type: "hls"
  };
}

function unpack(packed: string, base: number, count: number, words: string[]) {

  const toBase = (num: number, base: number) => {
    return num.toString(base);
  };

  let unpacked = packed;

  for (let i = 0; i < count; i++) {

    const key = toBase(i, base);

    if (words[i]) {

      const regex = new RegExp(`\\b${key}\\b`, "g");
      unpacked = unpacked.replace(regex, words[i]);

    }

  }

  return unpacked;
}

function extractHls(code: string) {

  const patterns = [
    /["']hls4["']\s*:\s*["'](https?:\/\/[^"']+)["']/,
    /["']hls3["']\s*:\s*["'](https?:\/\/[^"']+)["']/,
    /["']hls2["']\s*:\s*["'](https?:\/\/[^"']+)["']/,
    /["'](\/stream\/[^"']*master\.m3u8[^"']*)["']/
  ];

  for (const p of patterns) {

    const m = code.match(p);

    if (m) {
      return m[1];
    }

  }

  return null;
}
