'use client'

/**
 * Scene — the single R3F <Canvas> for the Edgeloop hero.
 *
 * Loaded ONLY via next/dynamic({ ssr:false }) from SceneCanvas.tsx. The canvas
 * is TRANSPARENT so the page's themed background (black↔white via ThemeSync)
 * shows through — that's what drives the invert. The object is line-art with
 * unlit materials, so no lights/environment are needed; a single Bloom pass
 * (see Effects) makes the bright lines glow. ResponsiveCamera pulls back on
 * narrow/portrait screens so the wide ring always fits.
 */

import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import Rig from './Rig'
import Effects from './Effects'

export const CAMERA_POSITION: [number, number, number] = [0, 0.4, 7]
export const CAMERA_FOV = 45

function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  useEffect(() => {
    const aspect = width / Math.max(1, height)
    // Portrait (aspect < 1) needs a larger z so the wide ring fits — but keep it
    // as close as possible so the sculpture stays a tappable size on phones.
    const z = Math.min(13, Math.max(7, 5.8 / aspect))
    camera.position.setZ(z)
    camera.updateProjectionMatrix()
  }, [camera, width, height])
  return null
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ResponsiveCamera />
      <Suspense fallback={null}>
        <Rig />
      </Suspense>
      <Effects />
    </Canvas>
  )
}
