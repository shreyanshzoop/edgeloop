/**
 * extract-base64.ts
 * -----------------
 * Replaces the old site's ~12MB of inline base64 with real files on disk.
 *
 * Reads the authoritative HTML source (edpre2.html), locates the
 * `const data = { ... }` object literal via a string-aware brace match,
 * evaluates it safely, then for every project decodes each embedded
 * img / imgs / video data URI and writes it to:
 *
 *   public/media/<category>/<project-slug>/<index>.<ext>
 *
 * Image dimensions are probed with sharp; `transparent` is true for PNGs.
 * A compact content/manifest.json is emitted for the xlsx → content step to
 * join against by name.
 *
 * Idempotent: wipes public/media and the manifest before writing. Logs counts
 * and total bytes. Never prints decoded file contents.
 *
 * Run:  node_modules/.bin/tsx scripts/extract-base64.ts   (from project root)
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const HTML_PATH =
  '/Users/shreyanshchoubey/Desktop/edgeloop-site-but-negi-doesit/edpre2.html'
const MEDIA_DIR = path.join(PROJECT_ROOT, 'public', 'media')
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'content', 'manifest.json')

/** Old HTML data keys → schema CategoryId (must match lib/store.ts). */
const CATEGORY_MAP = {
  anamorphic: 'anamorphics',
  artist: 'artists',
  brand: 'brands',
  dj: 'djsets',
} as const
type HtmlKey = keyof typeof CATEGORY_MAP
type CategoryId = (typeof CATEGORY_MAP)[HtmlKey]

interface HtmlProject {
  name: string
  img?: string
  imgs?: string[]
  layout?: 'duo' | 'trio' | 'stack' | 'row'
  video?: string
  desc?: string
}
type HtmlData = Record<HtmlKey, HtmlProject[]>

interface ManifestImage {
  src: string
  width: number
  height: number
  transparent: boolean
}
interface ManifestVideo {
  src: string
}
interface ManifestProject {
  category: CategoryId
  name: string
  slug: string
  layout?: 'duo' | 'trio' | 'stack' | 'row'
  images: ManifestImage[]
  video?: ManifestVideo
  /** Original HTML description, carried so the content step can fall back to
   *  it when the spreadsheet has no caption (artists / DJ sets). */
  htmlDesc?: string
}

/** lowercase, strip diacritics & punctuation, collapse whitespace → kebab-case. */
function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Map a data-URI MIME type to a file extension. */
function extForMime(mime: string): string | null {
  switch (mime.toLowerCase()) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    default:
      return null
  }
}

/** Parse a `data:<mime>;base64,<payload>` URI; returns null if not a data URI. */
function parseDataUri(uri: unknown): { mime: string; buffer: Buffer } | null {
  if (typeof uri !== 'string' || !uri.startsWith('data:')) return null
  const comma = uri.indexOf(',')
  if (comma < 0) return null
  const header = uri.slice(5, comma) // between "data:" and ","
  const isBase64 = /;base64/i.test(header)
  const mime = header.split(';')[0] || 'application/octet-stream'
  const payload = uri.slice(comma + 1)
  const buffer = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8')
  return { mime, buffer }
}

/**
 * String-aware brace match: from the first `{` at/after `fromIndex`, walk
 * until the matching `}` at depth 0, skipping over '...' / "..." / `...`
 * string literals (and their escapes). Returns the inclusive object text.
 */
function sliceObjectLiteral(src: string, fromIndex: number): string {
  const open = src.indexOf('{', fromIndex)
  if (open < 0) throw new Error('no opening brace found for data object')
  let depth = 0
  let inStr = false
  let quote = ''
  let esc = false
  for (let j = open; j < src.length; j++) {
    const c = src[j]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === quote) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = true
      quote = c
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return src.slice(open, j + 1)
    }
  }
  throw new Error('unterminated data object literal (no matching brace)')
}

function readHtmlData(): HtmlData {
  const full = fs.readFileSync(HTML_PATH, 'utf8')
  const marker = full.search(/(?:const|let|var)\s+data\s*=/)
  if (marker < 0) throw new Error('could not locate `const data =` in HTML')
  const objText = sliceObjectLiteral(full, marker)
  let data: HtmlData
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    data = new Function('return (' + objText + ')')() as HtmlData
  } catch (e) {
    throw new Error('failed to evaluate data object: ' + (e as Error).message)
  }
  for (const key of Object.keys(CATEGORY_MAP) as HtmlKey[]) {
    if (!Array.isArray(data[key])) {
      throw new Error(`data.${key} missing or not an array in HTML`)
    }
  }
  return data
}

function wipe() {
  fs.rmSync(MEDIA_DIR, { recursive: true, force: true })
  fs.rmSync(MANIFEST_PATH, { force: true })
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
}

async function main() {
  const data = readHtmlData()
  wipe()

  const manifest: ManifestProject[] = []
  let totalBytes = 0
  let imageCount = 0
  let videoCount = 0
  let skippedUris = 0
  const perCategory: Record<string, number> = {}

  for (const key of Object.keys(CATEGORY_MAP) as HtmlKey[]) {
    const category = CATEGORY_MAP[key]
    const projects = data[key]
    perCategory[category] = projects.length

    for (const proj of projects) {
      const slug = slugify(proj.name)
      const outDir = path.join(MEDIA_DIR, category, slug)

      // Gather image data URIs in deterministic order (img first, then imgs[]).
      const imageUris: string[] = []
      if (typeof proj.img === 'string' && proj.img.startsWith('data:')) {
        imageUris.push(proj.img)
      }
      if (Array.isArray(proj.imgs)) {
        for (const u of proj.imgs) {
          if (typeof u === 'string' && u.startsWith('data:')) imageUris.push(u)
        }
      }

      const images: ManifestImage[] = []
      let index = 0
      if (imageUris.length) fs.mkdirSync(outDir, { recursive: true })

      for (const uri of imageUris) {
        const parsed = parseDataUri(uri)
        if (!parsed) {
          skippedUris++
          continue
        }
        const ext = extForMime(parsed.mime)
        if (!ext) {
          console.warn(`  ! ${category}/${slug}: unknown image MIME "${parsed.mime}", skipping`)
          skippedUris++
          continue
        }
        const fileName = `${index}.${ext}`
        const filePath = path.join(outDir, fileName)
        fs.writeFileSync(filePath, parsed.buffer)
        totalBytes += parsed.buffer.byteLength

        const meta = await sharp(parsed.buffer).metadata()
        const width = meta.width ?? 0
        const height = meta.height ?? 0
        if (!width || !height) {
          throw new Error(`sharp could not read dimensions for ${category}/${slug}/${fileName}`)
        }
        images.push({
          src: `/media/${category}/${slug}/${fileName}`,
          width,
          height,
          transparent: parsed.mime.toLowerCase() === 'image/png',
        })
        imageCount++
        index++
      }

      // Video (single data URI). All HTML videos are empty strings today, but
      // handle real ones for robustness.
      let video: ManifestVideo | undefined
      const vParsed = parseDataUri(proj.video)
      if (vParsed) {
        const ext = extForMime(vParsed.mime)
        if (!ext) {
          console.warn(`  ! ${category}/${slug}: unknown video MIME "${vParsed.mime}", skipping`)
          skippedUris++
        } else {
          fs.mkdirSync(outDir, { recursive: true })
          const fileName = `video.${ext}`
          const filePath = path.join(outDir, fileName)
          fs.writeFileSync(filePath, vParsed.buffer)
          totalBytes += vParsed.buffer.byteLength
          video = { src: `/media/${category}/${slug}/${fileName}` }
          videoCount++
        }
      }

      const htmlDesc = typeof proj.desc === 'string' ? proj.desc.trim() : ''
      manifest.push({
        category,
        name: proj.name,
        slug,
        ...(proj.layout ? { layout: proj.layout } : {}),
        images,
        ...(video ? { video } : {}),
        ...(htmlDesc ? { htmlDesc } : {}),
      })
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')

  const mb = (totalBytes / (1024 * 1024)).toFixed(2)
  console.log('extract-base64: done')
  console.log(`  projects:        ${manifest.length}`)
  console.log(`  per-category:    ${JSON.stringify(perCategory)}`)
  console.log(`  images written:  ${imageCount}`)
  console.log(`  videos written:  ${videoCount}`)
  console.log(`  data URIs skipped: ${skippedUris}`)
  console.log(`  total bytes:     ${totalBytes} (${mb} MB)`)
  console.log(`  media dir:       ${MEDIA_DIR}`)
  console.log(`  manifest:        ${MANIFEST_PATH}`)
}

main().catch((e) => {
  console.error('extract-base64 FAILED:', e)
  process.exit(1)
})
