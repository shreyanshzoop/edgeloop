'use client'

/**
 * Home — the single-screen experience. 3D hero + persistent chrome on desktop;
 * a bottom tab bar (MobileNav) takes over navigation on small/touch screens.
 */

import { useEffect, useState } from 'react'
import SceneCanvas from '@/components/three/SceneCanvas'
import BrowsePanel from '@/components/ui/BrowsePanel'
import Contact from '@/components/ui/Contact'
import MobileNav from '@/components/ui/MobileNav'
import { useApp } from '@/lib/store'

const chrome: React.CSSProperties = {
  position: 'fixed',
  zIndex: 10,
  fontSize: '1rem',
  letterSpacing: '0.02em',
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

export default function Home() {
  const goHome = useApp((s) => s.goHome)
  const view = useApp((s) => s.view)
  const isMobile = useIsMobile()

  return (
    <main style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'var(--bg)' }}>
      <SceneCanvas />
      <BrowsePanel />
      <MobileNav />

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

      {!isMobile && (
        <span
          style={{ ...chrome, bottom: '1.4rem', right: '1.6rem', color: 'var(--fg-dim)', fontSize: '0.85rem' }}
        >
          estd. 2023
        </span>
      )}

      {view === 'idle' && !isMobile && (
        <span
          style={{ ...chrome, bottom: '1.4rem', left: '1.6rem', color: 'var(--fg-dim)', fontSize: '0.8rem' }}
        >
          click a planet to explore · the cube for about
        </span>
      )}
    </main>
  )
}
