'use client'

/**
 * Background — drives the OPAQUE canvas stage color from the theme so the
 * postprocessing (vignette/grain) applies to the whole frame, not just the
 * object. Lerps black↔white to stay in sync with the DOM's ~0.4s invert.
 */

import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import type { Theme } from '@/lib/theme'

const BG: Record<Theme, string> = { dark: '#0a0a0a', light: '#ffffff' }

export default function Background({ theme }: { theme: Theme }) {
  const scene = useThree((s) => s.scene)
  const current = useRef(new THREE.Color(BG[theme]))
  const target = useMemo(() => new THREE.Color(BG[theme]), [theme])

  useEffect(() => {
    scene.background = current.current
  }, [scene])

  useFrame((_, dt) => {
    current.current.lerp(target, 1 - Math.exp(-dt * 6))
  })

  return null
}
