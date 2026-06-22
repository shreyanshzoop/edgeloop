'use client'

/**
 * ArtistBelt — a 3D-perspective conveyor of one artist's media.
 *
 * Shown only in the artists hover preview: hover an artist → their media ride
 * the belt (rising from the lower-back, scaling up toward the viewer at center,
 * receding + fading as they crest the top). Media are cycled to fill the belt
 * so even a 2–3 item project reads as a full conveyor.
 *
 * Items can be stills (rendered as <img>) or self-hosted looping video clips
 * (rendered as muted <video> with a poster). To keep decoding cheap, only the
 * clips currently near the front/centre of the belt actually play; the rest are
 * paused on their poster/last frame until they swing back into view.
 *
 * Transforms are written imperatively from a rAF loop for smoothness; the loop
 * only runs while the belt is mounted (i.e. while an artist is hovered).
 */

import Image from 'next/image'
import { useEffect, useMemo, useRef } from 'react'
import type { MediaRef } from '@/content/schema'
import styles from './ArtistBelt.module.css'

/** Seconds for one item to advance one slot; full loop = SPEED * slots. */
const SPEED = 2.4
/** A clip plays only while |t-0.5| is within this window (limits concurrent decode). */
const PLAY_WINDOW = 0.16

export default function ArtistBelt({ items }: { items: MediaRef[] }) {
  // Cycle the artist's media so the belt is always full and evenly spaced.
  const slots = useMemo(() => {
    if (items.length === 0) return []
    const reps = Math.max(1, Math.ceil(8 / items.length))
    return Array.from({ length: reps * items.length }, (_, i) => items[i % items.length])
  }, [items])
  const N = slots.length

  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const vidRefs = useRef<(HTMLVideoElement | null)[]>([])
  const playing = useRef<boolean[]>([])

  useEffect(() => {
    const els = itemRefs.current
    const vids = vidRefs.current
    const play = playing.current

    const apply = (el: HTMLDivElement, i: number, t: number) => {
      // t in [0,1): 0 = bottom/back, 0.5 = center/front, 1 = top/back
      const ty = 56 - t * 112 // vertical travel
      const bell = Math.cos((t - 0.5) * Math.PI) // 1 at center, 0 at ends
      const tz = -240 + bell * 380 // depth: ends sit back, center forward
      const scale = 0.76 + bell * 0.44 // background stays sizeable
      const edge = Math.min(t, 1 - t) / 0.09 // fade only at the very edges
      const opacity = Math.max(0, Math.min(1, edge))
      el.style.transform =
        `translate(-50%, -50%) translateY(${ty}%) translateZ(${tz}px) scale(${scale})`
      el.style.opacity = String(opacity)
      el.style.zIndex = String(Math.round(bell * 100))

      // play only clips near the front; pause the rest on their last frame
      const v = vids[i]
      if (v) {
        const shouldPlay = Math.abs(t - 0.5) < PLAY_WINDOW
        if (shouldPlay && !play[i]) {
          play[i] = true
          v.play().catch(() => {})
        } else if (!shouldPlay && play[i]) {
          play[i] = false
          v.pause()
        }
      }
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      els.forEach((el, i) => el && apply(el, i, i / N))
      return
    }

    let raf = 0
    let last = performance.now()
    let progress = 0
    const loopDur = SPEED * N

    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      progress = (progress + dt / loopDur) % 1
      els.forEach((el, i) => {
        if (!el) return
        apply(el, i, (i / N + progress) % 1)
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [N])

  if (N === 0) return null

  return (
    <div className={styles.belt}>
      <div className={styles.stage}>
        {slots.map((m, i) => (
          <div
            key={i}
            className={styles.item}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
          >
            <div className={styles.thumb}>
              {m.kind === 'video' ? (
                <video
                  ref={(el) => {
                    vidRefs.current[i] = el
                  }}
                  className={styles.img}
                  src={m.src}
                  poster={m.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={m.alt}
                />
              ) : (
                <Image
                  src={m.src}
                  alt={m.alt}
                  width={m.width}
                  height={m.height}
                  className={styles.img}
                  sizes="440px"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
