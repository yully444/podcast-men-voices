#!/usr/bin/env node
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const FEED_URL = "https://cloud.mave.digital/66641";
const OUT_DIR = "src/content/episodes";

const RU2LAT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(text) {
  return text
    .toLowerCase()
    .split("")
    .map((c) => RU2LAT[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripCData(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function htmlToMarkdown(html) {
  return html
    .replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
    .replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**")
    .replace(/<b>([\s\S]*?)<\/b>/g, "**$1**")
    .replace(/<em>([\s\S]*?)<\/em>/g, "*$1*")
    .replace(/<i>([\s\S]*?)<\/i>/g, "*$1*")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/?p>/g, "\n\n")
    .replace(/<\/?(?:ul|ol)>/g, "\n")
    .replace(/<li>/g, "- ")
    .replace(/<\/li>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pickField(item, name) {
  const re = new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i");
  const m = item.match(re);
  return m ? stripCData(m[1]).trim() : null;
}

function pickAttr(item, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*\\s${attr}="([^"]+)"`, "i");
  const m = item.match(re);
  return m ? m[1] : null;
}

function isoDate(rfc822) {
  return new Date(rfc822).toISOString().slice(0, 10);
}

function shortDescription(markdown) {
  const firstPara = markdown.split(/\n\n+/)[0].replace(/\s+/g, " ").trim();
  if (firstPara.length <= 220) return firstPara;
  const truncated = firstPara.slice(0, 220);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

function escapeYaml(s) {
  return JSON.stringify(s);
}

const xml = await fetch(FEED_URL).then((r) => r.text());
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

mkdirSync(OUT_DIR, { recursive: true });

for (const f of readdirSync(OUT_DIR)) {
  if (f.endsWith(".md")) unlinkSync(join(OUT_DIR, f));
}

let written = 0;
for (const item of items) {
  const title = pickField(item, "title");
  if (!title) continue;
  const pubDate = pickField(item, "pubDate");
  const audioUrl = pickAttr(item, "enclosure", "url");
  const duration = pickField(item, "itunes:duration");
  const season = pickField(item, "itunes:season");
  const number = pickField(item, "itunes:episode");
  const descHtml = pickField(item, "description") || "";
  const description = htmlToMarkdown(descHtml);
  const summary = shortDescription(description);

  const slug = slugify(title);
  const date = isoDate(pubDate);

  const frontLines = [
    "---",
    `title: ${escapeYaml(title)}`,
    `date: ${date}`,
  ];
  if (season) frontLines.push(`season: ${season}`);
  if (number) frontLines.push(`number: ${number}`);
  frontLines.push(`description: ${escapeYaml(summary)}`);
  if (audioUrl) frontLines.push(`audioUrl: ${escapeYaml(audioUrl)}`);
  if (duration) frontLines.push(`duration: ${escapeYaml(duration)}`);
  frontLines.push("---", "", description, "");

  writeFileSync(join(OUT_DIR, `${slug}.md`), frontLines.join("\n"), "utf8");
  written++;
  console.log(`✓ ${slug}.md  (${title})`);
}

console.log(`\n${written} episodes written to ${OUT_DIR}`);
