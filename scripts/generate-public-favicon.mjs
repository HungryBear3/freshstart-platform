#!/usr/bin/env node
/**
 * Generate public/favicon.ico from the base64 PNG in favicon-base64.
 * No external dependencies - uses Node built-ins only.
 * ICO format: 6-byte header + 16-byte dir entry + PNG data.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Extract base64 from favicon-base64.ts (avoids import which may not work in ESM)
const faviconPath = path.join(__dirname, "..", "lib", "favicon-base64.ts")
const content = fs.readFileSync(faviconPath, "utf8")
const match = content.match(/"data:image\/png;base64,([A-Za-z0-9+/=]+)"/)
if (!match) throw new Error("Could not extract base64 from favicon-base64.ts")
const pngData = Buffer.from(match[1], "base64")

// ICO header (6 bytes): reserved(2)=0, type(2)=1, count(2)=1
const icoHeader = Buffer.alloc(6)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)

// Directory entry (16 bytes)
// width(1), height(1), colors(1)=0, reserved(1)=0, planes(2)=1, bpp(2)=32, size(4), offset(4)=22
const dirEntry = Buffer.alloc(16)
dirEntry[0] = 32
dirEntry[1] = 32
dirEntry[2] = 0
dirEntry[3] = 0
dirEntry.writeUInt16LE(1, 4)
dirEntry.writeUInt16LE(32, 6)
dirEntry.writeUInt32LE(pngData.length, 8)
dirEntry.writeUInt32LE(22, 12)

// Write ONLY to public/ - do NOT write app/favicon.ico.
// app/favicon.ico causes Next.js to unshift it to metadata.icons, emitting
// /favicon.ico?favicon.HASH.ico which overrides our base64 icon. Keeping only
// metadata.icons (base64 in layout) + public/favicon.ico for /favicon.ico requests.
const publicDir = path.join(__dirname, "..", "public")
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
const publicFaviconPath = path.join(publicDir, "favicon.ico")
fs.writeFileSync(publicFaviconPath, Buffer.concat([icoHeader, dirEntry, pngData]))
console.log("Generated public/favicon.ico")
