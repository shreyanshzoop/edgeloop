/**
 * xlsx-to-content.ts
 * ------------------
 * Joins the spreadsheet ("Edgeloop Projects (1).xlsx") with the media manifest
 * produced by extract-base64.ts to emit a typed, validated content payload at
 * content/site.ts.
 *
 * Flow:
 *   1. Parse the xlsx section-header layout ("ANAMORPHICS (6)", rows, …) into
 *      per-project { name, youtubeUrl, stats, caption } grouped by category.
 *   2. Load content/manifest.json (images + dims + html descriptions).
 *   3. Join the two BY NAME (normalize: lowercase, strip punctuation, collapse
 *      whitespace). The manifest is the source of truth for project set/order;
 *      the xlsx enriches with youtube / stats / better caption.
 *   4. Build a SiteContent object, derive layout + alt text + video.
 *   5. VALIDATE with SiteContent.parse(...) — fail loudly on any problem.
 *   6. Write content/site.ts.
 *
 * Run (after extract-base64):  node_modules/.bin/tsx scripts/xlsx-to-content.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import * as XLSX from 'xlsx'
import {
  SiteContent,
  type CategoryId,
  type ImageRef,
  type Layout,
  type Project,
  type VideoRef,
} from '../content/schema'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const XLSX_PATH =
  '/Users/shreyanshchoubey/Desktop/edgeloop-site-but-negi-doesit/Edgeloop Projects (1).xlsx'
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'content', 'manifest.json')
const OUT_PATH = path.join(PROJECT_ROOT, 'content', 'site.ts')

// ── Embedded constants ──────────────────────────────────────────────────────
const ABOUT =
  'edgeloop is a creative studio based on one belief: the right visual changes how people think, feel, and decide. we create artist visuals, brand content, dj set productions, and anamorphic experiences for companies. every project starts with intention and ends with something that could only come from us. no templates, no shortcuts. each piece is built from scratch, shaped by the specific energy of the project, the artist, or the brand we are working with. over the years we have contributed to live performances, launch events, marketing campaigns, and large-scale digital experiences. we believe powerful visuals do more than look good. they shift perception and stay with people long after the screen goes dark.'
const CONTACT = { phone: '+91 - 8210552902', email: 'edgeloop9@gmail.com' }
const BEHANCE_URL =
  'https://www.behance.net/gallery/238866345/Edgeloop-2025-Portfolio'

/** Category order + labels. Order here is the on-site category order. */
const CATEGORY_LABELS: Record<CategoryId, string> = {
  anamorphics: 'Anamorphics',
  artists: 'Artists',
  brands: 'Brands',
  djsets: 'DJ Sets',
}
const CATEGORY_ORDER: CategoryId[] = ['anamorphics', 'artists', 'brands', 'djsets']

/** Maps an xlsx section-header label to a CategoryId. */
const SECTION_TO_CATEGORY: Record<string, CategoryId> = {
  anamorphics: 'anamorphics',
  artists: 'artists',
  brands: 'brands',
  'dj sets': 'djsets',
}

// ── Types ───────────────────────────────────────────────────────────────────
interface ManifestImage {
  src: string
  width: number
  height: number
  transparent: boolean
}
interface ManifestProject {
  category: CategoryId
  name: string
  slug: string
  layout?: 'duo' | 'trio' | 'stack' | 'row'
  images: ManifestImage[]
  video?: { src: string }
  htmlDesc?: string
}
interface XlsxProject {
  name: string
  category: CategoryId
  youtubeUrl?: string
  stats?: string
  caption?: string
}

/** Join key: lowercase, strip punctuation, collapse whitespace. */
function normName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function clean(v: unknown): string {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

// ── Parse xlsx ──────────────────────────────────────────────────────────────
function parseXlsx(): XlsxProject[] {
  const wb = XLSX.readFile(XLSX_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: '',
  })

  const out: XlsxProject[] = []
  let current: CategoryId | null = null

  for (const row of rows) {
    const c0 = clean(row[0])
    const c1 = clean(row[1])

    // Section header? e.g. "ANAMORPHICS (6)" lives in col 0.
    const header = c0.replace(/\s*\(\d+\)\s*$/, '').trim()
    const headerKey = header.toLowerCase()
    if (SECTION_TO_CATEGORY[headerKey]) {
      current = SECTION_TO_CATEGORY[headerKey]
      continue
    }

    // Data row: numeric index in col 0, name in col 1.
    if (current && /^\d+$/.test(c0) && c1) {
      const youtubeUrl = clean(row[2])
      const stats = clean(row[4])
      const caption = clean(row[5])
      out.push({
        name: c1,
        category: current,
        ...(youtubeUrl ? { youtubeUrl } : {}),
        ...(stats ? { stats } : {}),
        ...(caption ? { caption } : {}),
      })
    }
  }
  return out
}

// ── Derive layout ───────────────────────────────────────────────────────────
function deriveLayout(
  htmlLayout: ManifestProject['layout'],
  imageCount: number,
): Layout {
  if (htmlLayout === 'duo' || htmlLayout === 'trio' || htmlLayout === 'stack' || htmlLayout === 'row') {
    return htmlLayout
  }
  if (imageCount > 1) return 'grid2x2'
  return 'single' // single image OR description-only
}

// ── Build content ───────────────────────────────────────────────────────────
function main() {
  const manifest: ManifestProject[] = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, 'utf8'),
  )
  const xlsx = parseXlsx()

  // Index xlsx rows by category + normalized name.
  const xlsxByKey = new Map<string, XlsxProject>()
  for (const x of xlsx) xlsxByKey.set(`${x.category}|${normName(x.name)}`, x)

  const matchedXlsxKeys = new Set<string>()
  const unmatchedManifest: string[] = []

  const categories = CATEGORY_ORDER.map((catId) => {
    const label = CATEGORY_LABELS[catId]
    const projectsForCat = manifest.filter((m) => m.category === catId)

    const projects: Project[] = projectsForCat.map((m, order) => {
      const key = `${catId}|${normName(m.name)}`
      const x = xlsxByKey.get(key)
      if (x) matchedXlsxKeys.add(key)
      else unmatchedManifest.push(`${catId}/${m.name}`)

      // Images with required alt + dims from manifest.
      const images: ImageRef[] = m.images.map((img, i) => ({
        src: img.src,
        alt:
          m.images.length > 1
            ? `${m.name} — ${label} (${i + 1})`
            : `${m.name} — ${label}`,
        width: img.width,
        height: img.height,
        transparent: img.transparent,
      }))

      // Description: xlsx caption preferred, else original HTML description.
      const description = x?.caption || m.htmlDesc || undefined

      // Video: prefer YouTube (xlsx), else self-hosted embedded loop if present.
      let video: VideoRef | undefined
      if (x?.youtubeUrl) {
        video = { provider: 'youtube', youtubeUrl: x.youtubeUrl }
      } else if (m.video?.src) {
        video = { provider: 'self', src: m.video.src }
      }

      const project: Project = {
        slug: m.slug,
        name: m.name,
        category: catId,
        order,
        layout: deriveLayout(m.layout, m.images.length),
        images,
        ...(video ? { video } : {}),
        ...(x?.stats ? { stats: x.stats } : {}),
        ...(description ? { description } : {}),
      }
      return project
    })

    return { id: catId, label, projects }
  })

  // xlsx rows that never matched a manifest project.
  const unmatchedXlsx = xlsx
    .filter((x) => !matchedXlsxKeys.has(`${x.category}|${normName(x.name)}`))
    .map((x) => `${x.category}/${x.name}`)

  const site = {
    about: ABOUT,
    estd: 2023 as const,
    contact: CONTACT,
    behanceUrl: BEHANCE_URL,
    categories,
  }

  // ── VALIDATE (fail loudly) ───────────────────────────────────────────────
  const result = SiteContent.safeParse(site)
  if (!result.success) {
    console.error('xlsx-to-content: SCHEMA VALIDATION FAILED')
    for (const issue of result.error.issues) {
      console.error(`  • [${issue.path.join('.')}] ${issue.message}`)
    }
    process.exit(1)
  }

  // ── Emit content/site.ts ─────────────────────────────────────────────────
  const banner = `// AUTO-GENERATED by scripts/xlsx-to-content.ts — do not edit by hand.
// Source: "Edgeloop Projects (1).xlsx" + content/manifest.json (extract-base64.ts).
// Regenerate: node_modules/.bin/tsx scripts/extract-base64.ts && node_modules/.bin/tsx scripts/xlsx-to-content.ts
`
  const body = `${banner}
import type { SiteContent } from './schema'

export const site: SiteContent = ${JSON.stringify(result.data, null, 2)} satisfies SiteContent

export default site
`
  fs.writeFileSync(OUT_PATH, body)

  // ── Report ────────────────────────────────────────────────────────────────
  const counts = Object.fromEntries(
    categories.map((c) => [c.id, c.projects.length]),
  )
  const total = categories.reduce((n, c) => n + c.projects.length, 0)
  console.log('xlsx-to-content: done')
  console.log(`  output:           ${OUT_PATH}`)
  console.log(`  total projects:   ${total}`)
  console.log(`  per-category:     ${JSON.stringify(counts)}`)
  console.log(`  schema validation: PASS`)
  console.log(
    `  with youtube:     ${categories.reduce((n, c) => n + c.projects.filter((p) => p.video?.provider === 'youtube').length, 0)}`,
  )
  console.log(
    `  with stats:       ${categories.reduce((n, c) => n + c.projects.filter((p) => p.stats).length, 0)}`,
  )
  console.log(
    `  with description: ${categories.reduce((n, c) => n + c.projects.filter((p) => p.description).length, 0)}`,
  )
  console.log(
    `  description-only: ${categories.reduce((n, c) => n + c.projects.filter((p) => p.images.length === 0).length, 0)}`,
  )
  if (unmatchedManifest.length) {
    console.log(`  manifest projects with NO xlsx row (${unmatchedManifest.length}):`)
    for (const s of unmatchedManifest) console.log(`     - ${s}`)
  } else {
    console.log('  manifest projects with NO xlsx row: 0')
  }
  if (unmatchedXlsx.length) {
    console.log(`  xlsx rows with NO manifest match (${unmatchedXlsx.length}):`)
    for (const s of unmatchedXlsx) console.log(`     - ${s}`)
  } else {
    console.log('  xlsx rows with NO manifest match: 0')
  }
}

main()
