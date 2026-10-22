// @vitest-environment node
import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as boardStories from './Board.stories'
import { BOARD_THEMES, PIECE_THEMES } from './themes'

const DIR = 'src/board'

describe('board stories', () => {
  it('cover every mode', () => {
    // View, play and edit each have a dedicated story.
    for (const name of ['View', 'Play', 'Edit']) expect(Object.keys(boardStories)).toContain(name)
  })

  it('cover orientation, overlays, promotion, castling, check and sizing', () => {
    for (const name of [
      'BlackOrientation',
      'Arrows',
      'Highlights',
      'PlayPromotion',
      'PlayCastling',
      'Check',
      'Sizes',
    ]) {
      expect(Object.keys(boardStories)).toContain(name)
    }
  })

  it('show every board and piece theme', () => {
    expect(Object.keys(boardStories)).toEqual(
      expect.arrayContaining(['BoardThemes', 'PieceThemes']),
    )
    expect(BOARD_THEMES.length).toBeGreaterThan(1)
    expect(PIECE_THEMES.length).toBeGreaterThan(1)
  })

  it('exist for every board component', () => {
    const components = readdirSync(DIR)
      .filter((f) => /^[A-Z].*\.tsx$/.test(f) && !/\.(test|stories)\.tsx$/.test(f))
      .map((f) => f.replace('.tsx', ''))
    const withStories = new Set(
      readdirSync(DIR)
        .filter((f) => f.endsWith('.stories.tsx'))
        .map((f) => f.replace('.stories.tsx', '')),
    )
    expect(components.filter((c) => !withStories.has(c))).toEqual([])
  })
})
