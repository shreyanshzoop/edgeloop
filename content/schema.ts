import { z } from 'zod'

/**
 * Typed, validated content model for the Edgeloop portfolio.
 *
 * Zod is the single source of truth: every schema below has an inferred TS
 * type exported alongside it. Generated content (content/site.ts) is validated
 * with `SiteContent.parse(...)` at generation time, so a missing alt, a bad
 * dimension, or a malformed structure fails loudly during the build pipeline
 * rather than silently shipping.
 *
 * Category ids intentionally mirror lib/store.ts `CATEGORY_IDS`
 * (anamorphics / artists / brands / djsets) — keep them in sync.
 */

export const CategoryId = z.enum(['anamorphics', 'artists', 'brands', 'djsets'])
export type CategoryId = z.infer<typeof CategoryId>

/**
 * A single image asset. `src` is a public path (served from /public), e.g.
 * "/media/brands/fila/0.jpg". `alt` is required and non-empty for a11y.
 * `transparent` is true for PNG cutouts, false for opaque JPEG banners.
 */
export const ImageRef = z.object({
  src: z.string().min(1).startsWith('/media/'),
  alt: z.string().min(1, 'alt text is required and must be non-empty'),
  width: z.int().positive(),
  height: z.int().positive(),
  transparent: z.boolean(),
})
export type ImageRef = z.infer<typeof ImageRef>

/**
 * A belt media item — either a still image or a self-hosted looping video clip.
 * `poster` (video only) is a still frame shown before the clip plays. Used by
 * the artists hover belt so a project can ride videos as well as pictures.
 */
export const MediaRef = z.object({
  kind: z.enum(['image', 'video']),
  src: z.string().min(1).startsWith('/media/'),
  alt: z.string().min(1, 'alt text is required and must be non-empty'),
  width: z.int().positive(),
  height: z.int().positive(),
  poster: z.string().startsWith('/media/').optional(),
})
export type MediaRef = z.infer<typeof MediaRef>

/**
 * A video reference. Either a YouTube embed (`provider: 'youtube'` +
 * `youtubeUrl`) or a self-hosted file (`provider: 'self'` + `src`).
 * `poster` is an optional still frame path.
 */
export const VideoRef = z
  .object({
    provider: z.enum(['youtube', 'self']),
    youtubeUrl: z.url().optional(),
    src: z.string().optional(),
    poster: z.string().optional(),
  })
  .refine((v) => (v.provider === 'youtube' ? !!v.youtubeUrl : !!v.src), {
    message: "youtube videos require `youtubeUrl`; self videos require `src`",
  })
export type VideoRef = z.infer<typeof VideoRef>

export const Layout = z.enum(['single', 'duo', 'trio', 'stack', 'row', 'grid2x2'])
export type Layout = z.infer<typeof Layout>

/**
 * A portfolio project. `images` may be empty for description-only entries
 * (several DJ sets and artists have no embedded media). `order` is the
 * 0-based position within its category.
 */
export const Project = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1),
  category: CategoryId,
  order: z.int().nonnegative(),
  layout: Layout,
  images: z.array(ImageRef),
  /** Optional belt media (images and/or videos) — overrides `images` on the
   *  artists hover belt when present. */
  media: z.array(MediaRef).optional(),
  video: VideoRef.optional(),
  stats: z.string().optional(),
  description: z.string().optional(),
})
export type Project = z.infer<typeof Project>

export const Category = z.object({
  id: CategoryId,
  label: z.string().min(1),
  projects: z.array(Project),
})
export type Category = z.infer<typeof Category>

/**
 * The whole site payload consumed by the app. `estd` is pinned to 2023.
 */
export const SiteContent = z.object({
  about: z.string().min(1),
  estd: z.literal(2023),
  contact: z.object({
    phone: z.string().min(1),
    email: z.email(),
  }),
  behanceUrl: z.url(),
  categories: z.array(Category),
})
export type SiteContent = z.infer<typeof SiteContent>
