#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/format-transcript.mjs <slug>");
  process.exit(1);
}

const path = join("src/content/episodes", `${slug}.vtt`);
const raw = readFileSync(path, "utf8").replace(/\r/g, "");

// Skip a leading WEBVTT header if it's already there
const startIdx = raw.indexOf("WEBVTT") === 0 ? raw.indexOf("\n") + 1 : 0;
const body = raw.slice(startIdx);

const HEADER_RE = /^([^:\n]{1,40}):\s*(\d+):(\d+)\s*$/;

const lines = body.split("\n");
const cues = [];
let current = null;
for (const line of lines) {
  const m = line.match(HEADER_RE);
  if (m) {
    if (current) cues.push(current);
    current = {
      speaker: m[1].trim(),
      start: parseInt(m[2], 10) * 60 + parseInt(m[3], 10),
      text: "",
    };
  } else if (current) {
    const trimmed = line.trim();
    if (trimmed) current.text += (current.text ? " " : "") + trimmed;
  }
}
if (current) cues.push(current);

for (const c of cues) {
  c.text = c.text.replace(/\s+/g, " ").trim();
}
const valid = cues.filter((c) => c.text.length > 0);

// Merge consecutive cues from the same speaker into one.
const merged = [];
for (const c of valid) {
  const last = merged[merged.length - 1];
  if (last && last.speaker === c.speaker) {
    last.text += " " + c.text;
  } else {
    merged.push({ ...c });
  }
}

function vttTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000`;
}

const out = ["WEBVTT", ""];
for (let i = 0; i < merged.length; i++) {
  const c = merged[i];
  const next = merged[i + 1];
  const end = next ? next.start : c.start + 30;
  out.push(`${vttTime(c.start)} --> ${vttTime(end)}`);
  out.push(`${c.speaker}: ${c.text}`);
  out.push("");
}

writeFileSync(path, out.join("\n"), "utf8");
console.log(`Wrote ${merged.length} cues to ${path} (raw cues: ${valid.length})`);
