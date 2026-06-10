'use client'

/**
 * Rig — the orbital sculpture.
 *
 *   <rig group>                  ← slides on X (browse) + idle turntable/float
 *     ├─ Cube     (origin)
 *     ├─ Ring     (origin, baked tilt)
 *     └─ Planet ×4 (each at its AUTHORED ring position)
 *
 * Everything is rendered at its authored GLB transform (see models.tsx), so the
 * composition matches the studio's Blender render. The whole assembly is rotated
 * as ONE rigid group — the planets stay glued to the ring exactly as composed.
 *
 * Only RIG_SCALE / camera framing are tunable here; the layout itself comes from
 * the GLBs, not from numbers in this file.
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
export const IDLE_SPIN_SPEED = 0.16 // rad/s turntable yaw at idle
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
  const reduced = useRef<boolean>(prefersReducedMotion())
  // Line-art inverts with the theme: bright white (glows) on the black hero,
  // dark on the white browse.
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

    // --- Scale down while parked so the content owns the stage ---
    const s = view === 'idle' ? RIG_SCALE : RIG_SCALE_PARKED
    easing.damp3(rig.current.scale, [s, s, s], rm ? 0 : SLIDE_SMOOTH_TIME, dt)

    // Continuous turntable — the loop keeps rotating in EVERY state (idle + browsing).
    if (!rm) rig.current.rotation.y += IDLE_SPIN_SPEED * dt

    if (view === 'idle' && !rm) {
      // Idle layers a gentle float + pointer parallax on top of the spin.
      rig.current.position.y = Math.sin(state.clock.elapsedTime * FLOAT_SPEED) * FLOAT_AMPLITUDE
      easing.damp(rig.current.rotation, 'x', -state.pointer.y * PARALLAX_STRENGTH, SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'z', state.pointer.x * PARALLAX_STRENGTH, SETTLE_SMOOTH_TIME, dt)
    } else {
      // Parked / sliding / reduced-motion: settle float + parallax tilt back to
      // neutral (rotation.y keeps spinning, above).
      easing.damp(rig.current.position, 'y', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'x', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
      easing.damp(rig.current.rotation, 'z', 0, rm ? 0 : SETTLE_SMOOTH_TIME, dt)
    }
  })

  return (
    <group ref={rig} scale={RIG_SCALE} {...props}>
      <Cube color={bodyColor} />
      <Ring color={bodyColor} />
      {CATEGORY_IDS.map((cat, i) => (
        <Planet key={cat} index={i} color={bodyColor} reduced={reduced.current} />
      ))}
    </group>
  )
}
