const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const NAVY = "#1e3a5f";
const WHITE = "#ffffff";
const OUTPUT_DIR = path.join(__dirname, "..", "public", "icons");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Rounded rectangle background
  const radius = size * 0.18;
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // "MP" text
  const fontSize = size * 0.42;
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MP", size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer("image/png");
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

function generateSplash(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Full navy background
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, width, height);

  // Centered "MP" logo circle
  const logoSize = Math.min(width, height) * 0.15;
  const cx = width / 2;
  const cy = height / 2;

  // White circle behind text
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(cx, cy, logoSize, 0, Math.PI * 2);
  ctx.fill();

  // "MP" text
  const fontSize = logoSize * 0.9;
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MP", cx, cy + fontSize * 0.03);

  // Subtitle
  const subSize = logoSize * 0.22;
  ctx.font = `${subSize}px Arial, Helvetica, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Madison Park HOA", cx, cy + logoSize + subSize * 1.5);

  const buffer = canvas.toBuffer("image/png");
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${width}x${height})`);
}

// App icons
generateIcon(192, "icon-192x192.png");
generateIcon(384, "icon-384x384.png");
generateIcon(512, "icon-512x512.png");
generateIcon(180, "apple-touch-icon.png");

// Splash screen
generateSplash(1170, 2532, "apple-splash-1170x2532.png");

console.log("\nAll icons generated successfully!");
