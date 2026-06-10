'use client'

/**
 * MobileNav — a bottom tab bar shown only on small/touch screens, where the 3D
 * planet-nav is too small to tap reliably. Lets you jump to About + the four
 * disciplines. (Home is the wordmark, top-left.) Hidden on desktop via CSS.
 */

import { useApp, CATEGORY_IDS, CATEGORY_LABELS } from '@/lib/store'
import styles from './MobileNav.module.css'

export default function MobileNav() {
  const activeCategory = useApp((s) => s.activeCategory)
  const aboutOpen = useApp((s) => s.aboutOpen)
  const selectCategory = useApp((s) => s.selectCategory)
  const selectAbout = useApp((s) => s.selectAbout)

  return (
    <nav className={styles.nav} aria-label="work">
      <button
        className={`${styles.item} ${aboutOpen ? styles.active : ''}`}
        onClick={() => selectAbout()}
      >
        about
      </button>
      {CATEGORY_IDS.map((id) => (
        <button
          key={id}
          className={`${styles.item} ${activeCategory === id ? styles.active : ''}`}
          onClick={() => selectCategory(id)}
        >
          {CATEGORY_LABELS[id]}
        </button>
      ))}
    </nav>
  )
}
