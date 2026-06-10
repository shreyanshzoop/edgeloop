import type { Metadata } from 'next'
import SceneCanvas from '@/components/three/SceneCanvas'

export const metadata: Metadata = {
  title: 'scene preview',
  robots: { index: false, follow: false },
}

/**
 * Isolated full-viewport route to eyeball the R3F hero at /scene-preview.
 *
 * This is a Server Component (no 'use client'): the SSR boundary is inside
 * SceneCanvas, which dynamically imports the Canvas with { ssr:false }. The
 * outer <main> is a full-viewport positioned container so SceneCanvas's
 * absolute-inset box has something to fill. Background uses the themed token
 * from globals.css (defaults to the dark "void" via <html data-theme>).
 */
export default function ScenePreviewPage() {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <SceneCanvas />
    </main>
  )
}
