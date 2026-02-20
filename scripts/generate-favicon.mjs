#!/usr/bin/env node
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pngToIco = (await import("png-to-ico")).default

const iconPath = path.join(__dirname, "..", "app", "icon.png")
const faviconPath = path.join(__dirname, "..", "app", "favicon.ico")

const buf = await pngToIco(iconPath)
fs.writeFileSync(faviconPath, buf)
console.log("Generated app/favicon.ico from app/icon.png")
