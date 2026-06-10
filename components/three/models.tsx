'use client'

/**
 * GLB loaders for the Edgeloop hero — styled after the edgeloop LOGO (a line-art
 * cube + ring). The cube is drawn as glowing EDGE LINES (not a solid); the ring
 * and planets are flat bright nodes. All use unlit materials with toneMapped
 * disabled so their color stays pure and the Bloom pass makes them glow on the
 * black hero. Color is theme-reactive: bright white on the dark hero, dark on
 * the white browse — the line-art logo, inverted.
 *
 * Models load at their AUTHORED transforms so the six files reassemble into the
 * studio's composition (cube at origin, tilted ring, planets baked on the ring).
 */

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useApp, CATEGORY_IDS } from '@/lib/store'

const MODEL_PATHS = {
  center: '/models/center-box.glb',
  ring: '/models/ring.glb',
  planets: [
    '/models/planet-1.glb',
    '/models/planet-2.glb',
    '/models/planet-3.glb',
    '/models/planet-4.glb',
  ],
} as const

const ALL_PATHS = [MODEL_PATHS.center, MODEL_PATHS.ring, ...MODEL_PATHS.planets]
ALL_PATHS.forEach((p) => useGLTF.preload(p))

/** Default color (overridden per-frame by the theme-reactive lerp). */
export const LINE_COLOR = '#f2f2f2'
/** Brand accent for the planet hover glow. */
export const HOVER_ACCENT = '#4a86ff'

const lerpColor = (c: THREE.Color, t: THREE.Color, dt: number, speed = 6) =>
  c.lerp(t, 1 - Math.exp(-dt * speed))

type GroupProps = ThreeElements['group']
interface ModelProps extends GroupProps {
  color?: string
}

/**
 * CUBE — drawn as glowing EDGE LINES (the logo), not a solid. An invisible box
 * provides the click target (→ About).
 */
export function Cube({ color = LINE_COLOR, ...props }: ModelProps) {
  const { scene } = useGLTF(MODEL_PATHS.center)
  const { edges, materials } = useMemo(() => {
    const edges: THREE.BufferGeometry[] = []
    const materials: THREE.LineBasicMaterial[] = []
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const eg = new THREE.EdgesGeometry(m.geometry, 1)
        eg.applyMatrix4(m.matrixWorld) // bake the authored transform
        edges.push(eg)
        materials.push(
          new THREE.LineBasicMaterial({ color: new THREE.Color(color), toneMapped: false }),
        )
      }
    })
    return { edges, materials }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  const target = useMemo(() => new THREE.Color(color), [color])
  useFrame((_, dt) => materials.forEach((m) => lerpColor(m.color, target, dt)))

  const setCursor = (c: string) => {
    if (typeof document !== 'undefined') document.body.style.cursor = c
  }

  return (
    <group
      {...props}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const st = useApp.getState()
        // Centered at home → About; parked (browsing) → back to home.
        if (st.view === 'idle') st.selectAbout()
        else st.goHome()
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        setCursor('pointer')
      }}
      onPointerOut={() => setCursor('auto')}
    >
      {/* invisible click target filling the cube volume (~4³) */}
      <mesh>
        <boxGeometry args={[4, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {edges.map((g, i) => (
        <lineSegments key={i} geometry={g} material={materials[i]} />
      ))}
    </group>
  )
}

/** Build a clone of a GLB with every mesh given a flat unlit material. */
function useFlatClone(path: string, color: string) {
  const { scene } = useGLTF(path)
  return useMemo(() => {
    const root = skeletonClone(scene) as THREE.Object3D
    const materials: THREE.MeshBasicMaterial[] = []
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), toneMapped: false })
        m.material = mat
        materials.push(mat)
      }
    })
    return { root, materials }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])
}

/** RING — a bright flat band that reads as the logo's orbit line and glows. */
export function Ring({ color = LINE_COLOR, ...props }: ModelProps) {
  const { root, materials } = useFlatClone(MODEL_PATHS.ring, color)
  const target = useMemo(() => new THREE.Color(color), [color])
  useFrame((_, dt) => materials.forEach((m) => lerpColor(m.color, target, dt)))
  return (
    <group {...props}>
      <primitive object={root} />
    </group>
  )
}

interface PlanetProps extends ModelProps {
  /** 0..3 → planet-1..4.glb → discipline order in CATEGORY_IDS. */
  index: number
  reduced?: boolean
}

/** PLANET — a bright node on the ring. Click → its discipline (slides toward the
 *  side the star is on); hover lights it brand-blue. */
export function Planet({ index, color = LINE_COLOR, reduced = false, ...props }: PlanetProps) {
  const { root, materials } = useFlatClone(MODEL_PATHS.planets[index], color)
  const camera = useThree((s) => s.camera)
  const hovered = useRef(false)
  const base = useMemo(() => new THREE.Color(color), [color])
  const hover = useMemo(() => new THREE.Color(HOVER_ACCENT), [])

  useFrame((_, dt) => {
    const t = hovered.current ? hover : base
    materials.forEach((m) => lerpColor(m.color, t, dt, reduced ? 24 : 8))
  })

  const setHover = (on: boolean) => {
    hovered.current = on
    if (typeof document !== 'undefined') document.body.style.cursor = on ? 'pointer' : 'auto'
  }

  return (
    <group {...props}>
      <primitive
        object={root}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          const ndcX = e.point.clone().project(camera).x
          useApp.getState().selectCategory(CATEGORY_IDS[index], ndcX < 0 ? 'left' : 'right')
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={() => setHover(false)}
      />
    </group>
  )
}
