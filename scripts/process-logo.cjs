// Remove the white background AND the chromatic halo (blue/pink) around the
// logo, leaving only the roxo + preto + branco "B" intact.
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const src = path.join(
  process.env.TEMP || 'C:\\Users\\Bokashi\\AppData\\Local\\Temp',
  'claude',
  'C--Users-Bokashi-Downloads-bokashipay',
  'e5b369ed-5a79-4140-8d38-366e47581249',
  'images',
  '3.webp',
)

const dest = path.resolve('public', 'logo.png')

;(async () => {
  if (!fs.existsSync(src)) {
    console.error('Source not found:', src)
    process.exit(1)
  }
  const img = sharp(src)
  const meta = await img.metadata()
  console.log('Source:', meta.width, 'x', meta.height, meta.format)

  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.alloc(data.length)

  // Helpers — RGB <-> HSL.
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return [h * 360, s, l]
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      a = data[i + 3]

    // 1. Near-white background: drop.
    const brightness = (r + g + b) / 3
    if (brightness > 232) {
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 0
      continue
    }

    // 2. Chromatic halo (blue/pink around the logo): drop.
    // Brand roxo has hue ~270 (purple/magenta). Blue halo is 220–245 (blue),
    // pink halo is 320–355 (pink). Saturations are high. We keep the roxo
    // band 255–295 and let the rest fall through a luminance threshold.
    const [h, s, l] = rgbToHsl(r, g, b)

    // Pixel is "halo" if:
    //   - it's saturated (s > 0.35), AND
    //   - it's outside the roxo band (h < 250 or h > 300), AND
    //   - it's reasonably light (l > 0.45 — the halo is bright).
    // We further soften edges.
    const isHalo = s > 0.35 && (h < 250 || h > 300) && l > 0.4

    let newA = a
    if (isHalo) {
      // Soft alpha based on how "halo-y" the pixel is.
      const strength = Math.min(1, (s - 0.35) * 2) * Math.min(1, (l - 0.4) * 2)
      newA = Math.round(a * (1 - strength))
      // If the result is essentially transparent, fully drop.
      if (newA < 12) {
        out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 0
        continue
      }
    } else if (brightness > 210) {
      // Soft white edge — fade out gently.
      newA = Math.round(((232 - brightness) / 22) * 255)
      if (newA < 12) {
        out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 0
        continue
      }
    }

    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    out[i + 3] = newA
  }

  await sharp(out, { raw: info })
    .png()
    .toFile(dest)

  const outMeta = await sharp(dest).metadata()
  console.log('Saved:', dest, '—', outMeta.width, 'x', outMeta.height)
})()