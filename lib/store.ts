'use client'

import { create } from 'zustand'

/**
 * The four disciplines, in ring/planet order (maps to planet-1..4.glb).
 * Old data keys (anamorphic/artist/brand/dj) map onto these ids.
 */
export const CATEGORY_IDS = ['anamorphics', 'artists', 'brands', 'djsets'] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  anamorphics: 'Anamorphics',
  artists: 'Artists',
  brands: 'Brands',
  djsets: 'DJ Sets',
}

/**
 * Top-level view state machine. The hovered/locked project are ORTHOGONAL
 * context (which IMG to preview / which detail is open), NOT view states —
 * so hovering a project never tears down the view.
 *
 *   idle ──selectCategory──▶ objectLeft ⇄ objectRight ──lockProject──▶ lockedDetail
 *     ▲                          │                                          │
 *     └──────── goHome ──────────┴───────────────── back ───────────────────┘
 */
export type View = 'idle' | 'objectLeft' | 'objectRight' | 'lockedDetail'
export type Side = 'left' | 'right'

export interface AppState {
  view: View
  side: Side
  activeCategory: CategoryId | null
  aboutOpen: boolean
  hoveredProjectId: string | null
  lockedProjectId: string | null
  // actions
  selectCategory: (cat: CategoryId, side?: Side) => void
  selectAbout: () => void
  hoverProject: (id: string | null) => void
  lockProject: (id: string) => void
  back: () => void // locked detail -> category list, same side
  goHome: () => void // -> idle, recenters the object
}

/** Object parks LEFT for even-indexed disciplines, RIGHT for odd — the two mirrored sketches. */
export function sideForCategory(cat: CategoryId): Side {
  return CATEGORY_IDS.indexOf(cat) % 2 === 0 ? 'left' : 'right'
}

export const useApp = create<AppState>((set) => ({
  view: 'idle',
  side: 'left',
  activeCategory: null,
  aboutOpen: false,
  hoveredProjectId: null,
  lockedProjectId: null,

  selectCategory: (cat, side) => {
    const s = side ?? sideForCategory(cat)
    set({
      view: s === 'left' ? 'objectLeft' : 'objectRight',
      side: s,
      activeCategory: cat,
      aboutOpen: false,
      lockedProjectId: null,
      hoveredProjectId: null,
    })
  },
  selectAbout: () =>
    set({
      view: 'objectLeft',
      side: 'left',
      activeCategory: null,
      aboutOpen: true,
      lockedProjectId: null,
      hoveredProjectId: null,
    }),
  hoverProject: (id) => set({ hoveredProjectId: id }),
  lockProject: (id) => set({ view: 'lockedDetail', aboutOpen: false, lockedProjectId: id }),
  back: () =>
    set((st) => ({
      view: st.side === 'left' ? 'objectLeft' : 'objectRight',
      lockedProjectId: null,
    })),
  goHome: () =>
    set({
      view: 'idle',
      activeCategory: null,
      aboutOpen: false,
      lockedProjectId: null,
      hoveredProjectId: null,
    }),
}))

/**
 * Theme polarity is derived from the view: black void at home, white light
 * while browsing the work. This is the approved "flip black↔white" behavior.
 */
export function themeForView(view: View): 'dark' | 'light' {
  return view === 'idle' ? 'dark' : 'light'
}

/** Where the orbital group parks on the X axis (world units). idle = centered. */
export function slideTargetX(view: View, side: Side): number {
  if (view === 'idle') return 0
  return side === 'left' ? -2.2 : 2.2
}
