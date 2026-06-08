#!/usr/bin/env node
/**
 * Creates minimal valid host image placeholders so production never 404s.
 * Replace with real headshots when available.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const hostsDir = join(root, "public", "assets", "images", "hosts");
const imagesDir = join(root, "public", "assets", "images");

mkdirSync(hostsDir, { recursive: true });

// Minimal valid 1x1 JPEG (107 bytes) — decodes in all browsers / next/image
const MINIMAL_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBoWGh8kJC0gJSYjIyMiIiYmJSYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiY//wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGA/9k=",
  "base64"
);

const HOST_JPGS = [
  "jake-merrick.jpg",
  "marcus-webb.jpg",
  "rachel-torres.jpg",
  "dan-hollis.jpg",
];

const created = [];

for (const name of HOST_JPGS) {
  const path = join(hostsDir, name);
  writeFileSync(path, MINIMAL_JPEG);
  created.push(path);
}

const authorSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Contributor avatar placeholder">
  <rect width="100" height="100" fill="#e8e4dc"/>
  <circle cx="50" cy="36" r="17" fill="#1a2b4a"/>
  <ellipse cx="50" cy="84" rx="26" ry="20" fill="#1a2b4a"/>
  <circle cx="50" cy="36" r="17" fill="none" stroke="#c41e3a" stroke-width="1.5" opacity="0.35"/>
</svg>
`;

const authorPath = join(imagesDir, "author-1.svg");
writeFileSync(authorPath, authorSvg, "utf8");
created.push(authorPath);

console.log("Created placeholder images:");
for (const p of created) {
  console.log("  " + p.replace(root + "\\", "").replace(root + "/", ""));
}