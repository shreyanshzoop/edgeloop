'use client'

/**
 * SceneCanvas — the SSR boundary for the 3D hero.
 *
 * three.js cannot run during SSR, so Scene.tsx is loaded via next/dynamic with
 * `{ ssr: false }`. Per Next 16 (confirmed in
 * node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), `ssr: false`
 * is ONLY valid inside a Client Component — calling it in a Server Component
 * throws. Hence this file is `'use client'`.
 *
 * The Canvas lives in a position:absolute inset:0 box so it fills its
 * positioned parent with NO layout shift; the loading placeholder occupies the
 * exact same box.
 */

import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  // Fixed-size placeholder (fills the same absolute box) → no layout shift.
  loading: () => (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  ),
})

export default function SceneCanvas() {
  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      // Decorative; the real navigation lives in the DOM layer (other agents).
      aria-hidden
    >
      <Scene />
    </div>
  )
}
