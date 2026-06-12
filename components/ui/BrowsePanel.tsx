'use client'

/**
 * BrowsePanel — the DOM "switchboard" that fills the white browse state.
 *
 * Mirrors the studio's left/right sketches: when a discipline is selected the
 * 3D object slides to one side and this panel occupies the opposite side with
 * a rail (discipline nav + project list) and a stage (hover IMG preview, or the
 * locked project detail with stats + YouTube). Reads everything from the store
 * and the generated content; it is the semantic, crawlable layer behind the canvas.
 */

import Image from 'next/image'
import { site } from '@/content/site'
import { useApp, CATEGORY_IDS, CATEGORY_LABELS } from '@/lib/store'
import type { Project } from '@/content/schema'
import styles from './BrowsePanel.module.css'

/** Pull the 11-char video id out of youtu.be / shorts / watch?v= / embed urls. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|\/shorts\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

function Preview({ project }: { project: Project }) {
  if (project.images.length === 0) {
    // No media yet for this project — show a loading state instead of a blank.
    return (
      <div className={styles.loaderWrap} role="status" aria-label={`${project.name} — media coming soon`}>
        <span className={styles.loader} aria-hidden />
        <span className={styles.loaderText}>loading...</span>
      </div>
    )
  }
  return (
    <div className={styles.previewGrid} data-layout={project.layout} data-project={project.slug}>
      {project.images.map((img) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          className={styles.previewImg}
          sizes="45vw"
        />
      ))}
    </div>
  )
}

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const vid =
    project.video?.provider === 'youtube' && project.video.youtubeUrl
      ? youtubeId(project.video.youtubeUrl)
      : null
  return (
    <article className={styles.detail}>
      <button className={styles.back} onClick={onBack}>
        ← back
      </button>
      <h2 className={styles.detailName}>{project.name}</h2>
      {project.stats && <p className={styles.stats}>{project.stats}</p>}
      {/* images shown inside detail on touch/mobile (no hover preview there) */}
      {project.images.length > 0 && (
        <div className={styles.detailImages} data-layout={project.layout}>
          {project.images.map((img) => (
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={img.width}
              height={img.height}
              className={styles.previewImg}
              sizes="90vw"
            />
          ))}
        </div>
      )}
      {vid && (
        <div className={styles.video}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${vid}`}
            title={project.name}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {project.description && <p className={styles.desc}>{project.description}</p>}
    </article>
  )
}

export default function BrowsePanel() {
  const view = useApp((s) => s.view)
  const side = useApp((s) => s.side)
  const activeCategory = useApp((s) => s.activeCategory)
  const aboutOpen = useApp((s) => s.aboutOpen)
  const hoveredProjectId = useApp((s) => s.hoveredProjectId)
  const lockedProjectId = useApp((s) => s.lockedProjectId)
  const hoverProject = useApp((s) => s.hoverProject)
  const lockProject = useApp((s) => s.lockProject)
  const back = useApp((s) => s.back)
  const selectCategory = useApp((s) => s.selectCategory)

  const open = view !== 'idle'
  // Panel sits OPPOSITE the object: object-left → panel-right, and vice versa.
  const panelSide = side === 'left' ? 'right' : 'left'

  // Prev/next arrows cycle the disciplines, keeping the object on its current side.
  const cycle = (delta: number) => {
    if (!activeCategory) return
    const n = CATEGORY_IDS.length
    const i = CATEGORY_IDS.indexOf(activeCategory)
    selectCategory(CATEGORY_IDS[((i + delta) % n + n) % n], side)
  }

  // Neighboring sections peek in, faded, on either side of the switcher:
  //   …morphic ‹ brands › dj se…
  const catIndex = activeCategory ? CATEGORY_IDS.indexOf(activeCategory) : -1
  const n = CATEGORY_IDS.length
  const prevLabel = catIndex >= 0 ? CATEGORY_LABELS[CATEGORY_IDS[(catIndex - 1 + n) % n]] : ''
  const nextLabel = catIndex >= 0 ? CATEGORY_LABELS[CATEGORY_IDS[(catIndex + 1) % n]] : ''

  const category = site.categories.find((c) => c.id === activeCategory)
  const projects = category?.projects ?? []
  const locked = projects.find((p) => p.slug === lockedProjectId) ?? null
  const hovered = projects.find((p) => p.slug === hoveredProjectId) ?? null

  return (
    <aside
      className={`${styles.panel} ${styles[panelSide]} ${open ? styles.open : ''}`}
      aria-hidden={!open}
    >
      <div className={styles.rail}>
        {aboutOpen ? (
          <h2 className={styles.railTitle}>about</h2>
        ) : category ? (
          <div className={styles.switcher}>
            <button
              key={`p-${category.id}`}
              className={styles.ghostPrev}
              onClick={() => cycle(-1)}
              aria-label={`go to ${prevLabel}`}
            >
              {prevLabel}
            </button>
            <button className={styles.arrow} onClick={() => cycle(-1)} aria-label="previous discipline">
              ‹
            </button>
            <h2 key={category.id} className={styles.railTitle}>
              {category.label}
            </h2>
            <button className={styles.arrow} onClick={() => cycle(1)} aria-label="next discipline">
              ›
            </button>
            <button
              key={`n-${category.id}`}
              className={styles.ghostNext}
              onClick={() => cycle(1)}
              aria-label={`go to ${nextLabel}`}
            >
              {nextLabel}
            </button>
          </div>
        ) : null}

        {!aboutOpen && category && (
          <ol className={styles.list}>
            {projects.map((p) => (
              <li key={p.slug}>
                <button
                  className={`${styles.item} ${lockedProjectId === p.slug ? styles.playing : ''}`}
                  onMouseEnter={() => hoverProject(p.slug)}
                  onMouseLeave={() => hoverProject(null)}
                  onFocus={() => hoverProject(p.slug)}
                  onBlur={() => hoverProject(null)}
                  onClick={() => lockProject(p.slug)}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={styles.stage}>
        {aboutOpen ? (
          <p className={styles.about}>{site.about}</p>
        ) : locked ? (
          <ProjectDetail project={locked} onBack={back} />
        ) : hovered ? (
          <Preview project={hovered} />
        ) : category ? (
          <p className={styles.prompt}>select a project</p>
        ) : null}
      </div>
    </aside>
  )
}
