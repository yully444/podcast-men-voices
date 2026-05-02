export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
}

const TIME_LINE = /^(\d{2}:)?\d{2}:\d{2}\.\d{3}\s+-->\s+(\d{2}:)?\d{2}:\d{2}\.\d{3}/;

function parseTimestamp(stamp: string): number {
  const parts = stamp.trim().split(":");
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) {
    [h, m] = parts.slice(0, 2).map(Number);
    s = parseFloat(parts[2]);
  } else {
    [m] = parts.slice(0, 1).map(Number);
    s = parseFloat(parts[1]);
  }
  return h * 3600 + m * 60 + s;
}

export function parseVtt(raw: string): TranscriptCue[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const cues: TranscriptCue[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!TIME_LINE.test(line)) {
      i++;
      continue;
    }
    const [startStr, endStr] = line.split("-->").map((s) => s.trim().split(" ")[0]);
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    i++;
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i]);
      i++;
    }
    if (textLines.length > 0) {
      cues.push({ start, end, text: textLines.join(" ").trim() });
    }
    i++;
  }
  return cues;
}

export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
