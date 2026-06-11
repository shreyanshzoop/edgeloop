'use client'

/**
 * Rig — the orbital sculpture.
 *
 *   <rig group>                  ← slides on X (browse) + idle float/parallax + scale
 *     ├─ <cube group>            ← spins on ITS OWN axis (Y turntable)
 *     └─ <loop group>            ← Ring + 4 planets; revolves around the ring's OWN
 *           ├─ Ring                 tilted axis (computed at runtime from the four
 *           └─ Planet ×4            planets' authored positions, which define the
 *                                   ring plane) — so planets travel along the ring.
 *
 * Everything renders at its authored GLB transform (see models.tsx); the cube and
 * the loop carry independent rotations so they read as two separate motions.
 */

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { easing } from 'maath'
import { useApp, slideTargetX, CATEGORY_IDS, themeForView } from '@/lib/store'
import { Cube, Ring, Planet } from './models'

/** Global scale for the whole assembly (authored span ≈ 8 units across). */
export const RIG_SCALE = 0.6
/** Scale while parked aside (browsing) — larger, so the half-visible object
 *  fills the viewport vertically like a monolith at the edge. */
export const RIG_SCALE_PARKED = 0.85

/* ---- motion tuning ---- */
export const SLIDE_SMOOTH_TIME = 0.5 // seconds for the browse slide (damp3)
/** Touch-first devices get a slower loop so taps can land on the planets. */
const COARSE_POINTER =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

export const CUBE_SPIN_SPEED = 0.18 // rad/s — cube turntable on its own axis
export const LOOP_SPIN_SPEED = COARSE_POINTER ? 0.16 : 0.28 // rad/s — loop revolution
export const FLOAT_AMPLITUDE = 0.1 // world units of gentle Y bob at idle
export const FLOAT_SPEED = 0.6 // rad/s of the float sine
export const PARALLAX_STRENGTH = 0.12 // pointer nudge on idle tilt
export const SETTLE_SMOOTH_TIME = 0.3 // ease parallax/float back when parked

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

export default function Rig(props: ThreeElements['group']) {
  const rig = useRef<THREE.Group>(null!)
  const cube = useRef<THREE.Group>(null!)
  const loop = useRef<THREE.Group>(null!)
  const planetRefs = useRef<(THREE.Group | null)[]>([])
  /** The ring's own rotation axis (loop-local space); derived once from the
   *  4 planets' positions, which lie on the tilted ring plane. */
  const loopAxis = useRef<THREE.Vector3 | null>(null)
  const reduced = useRef<boolean>(prefersReducedMotion())
  // Line-art inverts with the theme: bright (glows) on the black hero, dark on white.
  const bodyColor = useApp((s) => (themeForView(s.view) === 'dark' ? '#f2f2f2' : '#141414'))

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30) // clamp big gaps (tab refocus)
    const rm = reduced.current
    const { view, side } = useApp.getState()
    if (!rig.current) return

    // --- Slide the whole sculpture toward its parked / centered target ---
    easing.damp3(
      rig.current.position,
      [slideTargetX(view, side), rig.current.position.y, 0],
      rm ? 0 : SLIDE_SMOOTH_TIME,
      dt,
    )

    // --- Scale up while parked so the half-visible object fills the edge ---
    const s = view === 'idle' ? RIG_SCALE : RIG_SCALE_PARKED
    easing.damp3(rig.current.scale, [s, s, s], rm ? 0 : SLIDE_SMOOTH_TIME, dt)

    // --- Derive the loop's own axis once all four planets are measurable ---
    if (!loopAxis.current && loop.current) {
      const groups = planetRefs.current.filter(Boolean) as THREE.Group[]
      if (groups.length === 4) {
        const centers = groups.map((g) =>
          loop.current.worldToLocal(
            new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()),
          ),
        )
        const v1 = centers[0].clone().sub(centers[2])
        const v2 = centers[1].clone().sub(centers[3])
        const n = new THREE.Vector3().crossVectors(v1, v2)
        loopAxis.current = n.lengthSq() > 1e-6 ? n.normalize() : new THREE.Vector3(0, 1, 0)
      }
    }

    if (!rm) {
      // --- Cube spins on its own axis ---
      if (cube.current) cube.current.rotation.y += CUBE_SPIN_SPEED * dt
      // --- Loop revolves around the ring's own (tilted) axis ---
      if (loop.current && loopAxis.current) {
        loop.current.rotateOnAxis(loopAxis.current, LOOP_SPIN_SPEED * dt)
      }
    }

    if (view === 'idle' && !rm) {
      // Idle adds a gentle float + pointer parallax on the whole rig.
      rig.current.position.y = Math.sin(state.clock.elapsedTime * FLOAT_SPEED) * FLOAT_AMPLITUDE
      easing.damp(rig.current.rotation, 'x', -state.pointer.y * PARALLAX_STRENGTH, SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'z', state.pointer.x * PARALLAX_STRENGTH, SETTLE_SMOOTH_TIME, dt)
    } else {
      // Parked / sliding / reduced-motion: settle float + tilt back to neutral.
      easing.damp(rig.current.position, 'y', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'x', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'z', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
    }
  })

  return (
    <group ref={rig} scale={RIG_SCALE} {...props}>
      <group ref={cube}>
        <Cube color={bodyColor} />
      </group>
      <group ref={loop}>
        <Ring color={bodyColor} />
        {CATEGORY_IDS.map((cat, i) => (
          <group
            key={cat}
            ref={(el) => {
              planetRefs.current[i] = el
            }}
          >
            <Planet
              index={i}
              color={bodyColor}
              reduced={reduced.current}
              occludeRef={cube}
            />
          </group>
        ))}
      </group>
    </group>
  )
}
