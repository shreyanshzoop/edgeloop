'use client'

/**
 * Home — the single-screen experience.
 *
 * The 3D object is the hero; clicking a planet (a discipline) or the cube
 * (about) slides it aside and flips the world white while <BrowsePanel> fills
 * the opposite side with the work. The wordmark returns home; contact opens a
 * modal. ESTD mark + first-run hint round out the persistent chrome.
 */

import SceneCanvas from '@/components/three/SceneCanvas'
import BrowsePanel from '@/components/ui/BrowsePanel'
import Contact from '@/components/ui/Contact'
import { useApp } from '@/lib/store'

const chrome: React.CSSProperties = {
  position: 'fixed',
  zIndex: 10,
  fontSize: '1rem',
  letterSpacing: '0.02em',
}

export default function Home() {
  const goHome = useApp((s) => s.goHome)
  const view = useApp((s) => s.view)

  return (
    <main style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--bg)' }}>
      <SceneCanvas />
      <BrowsePanel />

      <button
        onClick={goHome}
        aria-label="edgeloop — home"
        style={{
          ...chrome,
          top: '1.4rem',
          left: '1.6rem',
          color: 'var(--fg)',
          background: 'none',
          border: 'none',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        edgeloop
      </button>

      <Contact />

      <span
        style={{ ...chrome, bottom: '1.4rem', right: '1.6rem', color: 'var(--fg-dim)', fontSize: '0.85rem' }}
      >
        estd. 2023
      </span>

      {view === 'idle' && (
        <span
          style={{ ...chrome, bottom: '1.4rem', left: '1.6rem', color: 'var(--fg-dim)', fontSize: '0.8rem' }}
        >
          click a planet to explore · the cube for about
        </span>
      )}
    </main>
  )
}
