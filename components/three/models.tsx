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

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, Html } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useApp, CATEGORY_IDS, CATEGORY_LABELS } from '@/lib/store'

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

  // Solid black interior — the cube is NOT see-through: it occludes its own back
  // edges and the ring passing behind it. Slightly shrunk so the edge lines stay
  // crisp on the surface (no z-fighting). Doubles as the click target.
  const fill = useMemo(() => {
    const root = skeletonClone(scene) as THREE.Object3D
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#0a0a0a'), toneMapped: false })
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) m.material = mat
    })
    return root
  }, [scene])

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
      <primitive object={fill} scale={0.996} />
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

/** How long a planet's name lingers after the cursor leaves its hit area. */
export const LABEL_LINGER_MS = 1500
/** Label anchor height above the planet center (local units). */
const LABEL_Y_OFFSET = 0.5

interface PlanetProps extends ModelProps {
  /** 0..3 → planet-1..4.glb → discipline order in CATEGORY_IDS. */
  index: number
  reduced?: boolean
  /** Objects the label occludes against (e.g. the solid cube). */
  occludeRef?: React.RefObject<THREE.Object3D | null>
}

/** True on touch-first devices (no fine pointer) — fingers need bigger targets. */
const COARSE_POINTER =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

/** Forgiving hit area: invisible sphere around each planet so clicks land even
 *  10–20px outside the visible cube (or when the spin carries it past the cursor).
 *  Planets are ~0.4 units; much larger on touch, where the camera also sits
 *  farther back and fingers are less precise than a cursor. */
export const PLANET_HIT_RADIUS = COARSE_POINTER ? 1.0 : 0.55

/** PLANET — a bright node on the ring. Click → its discipline (slides toward the
 *  side the star is on); hover lights it brand-blue. Events live on the group so
 *  both the planet mesh and its invisible hit halo trigger them. */
export function Planet({
  index,
  color = LINE_COLOR,
  reduced = false,
  occludeRef,
  ...props
}: PlanetProps) {
  const { root, materials } = useFlatClone(MODEL_PATHS.planets[index], color)
  const camera = useThree((s) => s.camera)
  const hovered = useRef(false)
  const base = useMemo(() => new THREE.Color(color), [color])
  const hover = useMemo(() => new THREE.Color(HOVER_ACCENT), [])

  // This planet's own name label: shows on hover (incl. the halo), lingers
  // LABEL_LINGER_MS after the cursor leaves.
  const [labelOn, setLabelOn] = useState(false)
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (labelTimer.current) clearTimeout(labelTimer.current)
  }, [])

  // The planet's position is baked into the GLB mesh — find its center once so
  // the hit halo can sit exactly on it.
  const center = useMemo(
    () => new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()),
    [root],
  )

  useFrame((_, dt) => {
    const t = hovered.current ? hover : base
    materials.forEach((m) => lerpColor(m.color, t, dt, reduced ? 24 : 8))
  })

  const setHover = (on: boolean) => {
    hovered.current = on
    if (typeof document !== 'undefined') document.body.style.cursor = on ? 'pointer' : 'auto'
    if (labelTimer.current) clearTimeout(labelTimer.current)
    if (on) {
      setLabelOn(true)
    } else {
      labelTimer.current = setTimeout(() => setLabelOn(false), LABEL_LINGER_MS)
    }
  }

  return (
    <group
      {...props}
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
    >
      <primitive object={root} />
      {/* invisible, raycastable hit halo */}
      <mesh position={center}>
        <sphereGeometry args={[PLANET_HIT_RADIUS, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* This planet's name, anchored just above it; tracks it as the loop spins.
          `occlude` raycasts against the solid cube, so the label genuinely hides
          when the planet passes behind it. Accent text-shadow gives the shine. */}
      <Html
        position={[center.x, center.y + LABEL_Y_OFFSET, center.z]}
        center
        zIndexRange={[4, 0]}
        occlude={occludeRef ? [occludeRef as React.RefObject<THREE.Object3D>] : undefined}
        style={{ pointerEvents: 'none' }}
      >
        <span
          style={{
            display: 'block',
            transform: 'translateY(-8px)',
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            color: 'var(--fg)',
            textShadow: '0 0 10px var(--accent), 0 0 3px currentColor',
            opacity: labelOn ? 1 : 0,
            transition: 'opacity 0.45s ease',
            userSelect: 'none',
          }}
        >
          {CATEGORY_LABELS[CATEGORY_IDS[index]]}
        </span>
      </Html>
    </group>
  )
}
