/**
 * Theme token contract for edgeloop.
 *
 * The signature interaction is a black<->white palette INVERSION tied to app
 * state: a black void at home/idle, white while browsing the work. The flip is
 * driven by the `data-theme` attribute on <html> ("dark" | "light"), set by
 * `components/ui/ThemeSync.tsx` from `themeForView(view)` in `lib/store.ts`.
 *
 * The actual color values live in `app/globals.css` under
 * `[data-theme="dark"]` / `[data-theme="light"]`. This module re-exports the
 * CSS custom-property NAMES so TS/JS consumers (inline styles, R3F materials,
 * canvas clear colors) can reference the same tokens without stringly-typed
 * drift. The single blue accent is constant across both themes.
 */

export type Theme = "dark" | "light";

/** CSS custom-property names for the theme tokens. */
export const TOKENS = {
  /** Page background. dark = near-black, light = white. */
  bg: "--bg",
  /** Primary foreground (text). dark = light grey, light = mid grey. */
  fg: "--fg",
  /** Muted foreground for secondary text. */
  fgMuted: "--fg-muted",
  /** Dimmest foreground for hints / disabled. */
  fgDim: "--fg-dim",
  /** The single blue accent. CONSTANT across themes. */
  accent: "--accent",
  /** Raised surface (cards, panels), one step off the background. */
  surface: "--surface",
  /** Hairline borders / dividers. */
  hairline: "--hairline",
} as const;

export type TokenName = keyof typeof TOKENS;

/** The blue accent, available outside CSS (e.g. three.js materials, meta theme-color). */
export const ACCENT = "#2d6cff" as const;

/** `var(--token)` helper, e.g. `cssVar("bg")` -> `"var(--bg)"`. */
export function cssVar(token: TokenName): string {
  return `var(${TOKENS[token]})`;
}
