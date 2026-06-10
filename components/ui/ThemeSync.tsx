'use client'

import { useEffect } from 'react'
import { useApp, themeForView } from '@/lib/store'

/**
 * Wires the signature black<->white palette inversion.
 *
 * Subscribes to the app store's `view` and, in an effect, writes the derived
 * polarity to `<html data-theme="...">`. `themeForView` returns "dark" at
 * idle/home (black void) and "light" while browsing the work (white). The CSS
 * token system in `app/globals.css` keys off that attribute, and the ~0.4s
 * background/color transition does the actual flip.
 *
 * Renders nothing — it's a pure side-effect bridge mounted once in the layout.
 */
export default function ThemeSync() {
  const view = useApp((s) => s.view)

  useEffect(() => {
    document.documentElement.dataset.theme = themeForView(view)
  }, [view])

  return null
}
