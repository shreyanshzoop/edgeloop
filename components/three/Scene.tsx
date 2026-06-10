'use client'

/**
 * Scene — the single R3F <Canvas> for the Edgeloop hero.
 *
 * Loaded ONLY via next/dynamic({ ssr:false }) from SceneCanvas.tsx. The canvas
 * is TRANSPARENT so the page's themed background (black↔white via ThemeSync)
 * shows through — that's what drives the invert. The object is line-art with
 * unlit materials, so no lights/environment are needed; a single Bloom pass
 * (see Effects) makes the bright lines glow.
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Rig from './Rig'
import Effects from './Effects'

export const CAMERA_POSITION: [number, number, number] = [0, 0.4, 7]
export const CAMERA_FOV = 45

export default function Scene() {
  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Rig />
      </Suspense>
      <Effects />
    </Canvas>
  )
}
