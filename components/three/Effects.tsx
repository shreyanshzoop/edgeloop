'use client'

/**
 * Effects — a single Bloom pass that makes the bright line-art glow on the dark
 * hero. Kept to Bloom only so the canvas stays transparent (the page background
 * shows through for the black↔white invert). Dark line-art on the white browse
 * falls below the luminance threshold, so it doesn't bloom there.
 */

import { EffectComposer, Bloom } from '@react-three/postprocessing'

export default function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.25}
        radius={0.75}
        mipmapBlur
      />
    </EffectComposer>
  )
}
