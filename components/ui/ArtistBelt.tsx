'use client'

/**
 * ArtistBelt — a 3D-perspective conveyor of one artist's images.
 *
 * Shown only in the artists hover preview: hover an artist → their images ride
 * the belt (rising from the lower-back, scaling up toward the viewer at center,
 * receding + fading as they crest the top). The artist's images are cycled to
 * fill the belt so even a 2–3 image project reads as a full conveyor.
 *
 * Transforms are written imperatively from a rAF loop for smoothness; the loop
 * only runs while the belt is mounted (i.e. while an artist is hovered).
 */

import Image from 'next/image'
import { useEffect, useMemo, useRef } from 'react'
import type { ImageRef } from '@/content/schema'
import styles from './ArtistBelt.module.css'

/** Seconds for one image to advance one slot; full loop = SPEED * slots. */
const SPEED = 2.4

export default function ArtistBelt({ images }: { images: ImageRef[] }) {
  // Cycle the artist's images so the belt is always full and evenly spaced.
  const slots = useMemo(() => {
    if (images.length === 0) return []
    const reps = Math.max(1, Math.ceil(8 / images.length))
    return Array.from({ length: reps * images.length }, (_, i) => images[i % images.length])
  }, [images])
  const N = slots.length

  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const els = itemRefs.current

    const apply = (el: HTMLDivElement, t: number) => {
      // t in [0,1): 0 = bottom/back, 0.5 = center/front, 1 = top/back
      // Pure flat belt: identical rectangles travelling straight up, evenly
      // spaced — no perspective, no scale, no tilt, no forward push. The belt's
      // top/bottom mask feathers them as they enter/exit.
      const span = N * 125 // % of item height across one full loop (125% per item)
      const ty = span / 2 - t * span
      el.style.transform = `translate(-50%, -50%) translateY(${ty}%)`
      el.style.opacity = '1'
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      els.forEach((el, i) => el && apply(el, i / N))
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
        apply(el, (i / N + progress) % 1)
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
        {slots.map((img, i) => (
          <div
            key={i}
            className={styles.item}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
          >
            <div className={styles.thumb}>
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                className={styles.img}
                sizes="440px"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
