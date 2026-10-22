import { FILES, RANKS, type Color, type Square } from '@/core'

export type CursorKey =
  'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' | 'PageUp' | 'PageDown'

export const isCursorKey = (key: string): key is CursorKey =>
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(
    key,
  )

const clamp = (value: number) => Math.min(7, Math.max(0, value))

/**
 * Moves the keyboard cursor in screen directions, so "up" is toward the far
 * side of the board whichever way it is oriented. Stops at the edges.
 */
export function moveCursor(cursor: Square, key: CursorKey, orientation: Color): Square {
  const flip = orientation === 'white' ? 1 : -1
  let file = FILES.indexOf(cursor[0] as (typeof FILES)[number])
  let rank = RANKS.indexOf(cursor[1] as (typeof RANKS)[number])
  switch (key) {
    case 'ArrowRight':
      file += flip
      break
    case 'ArrowLeft':
      file -= flip
      break
    case 'ArrowUp':
      rank += flip
      break
    case 'ArrowDown':
      rank -= flip
      break
    case 'Home':
      file = orientation === 'white' ? 0 : 7
      break
    case 'End':
      file = orientation === 'white' ? 7 : 0
      break
    case 'PageUp':
      rank = orientation === 'white' ? 7 : 0
      break
    case 'PageDown':
      rank = orientation === 'white' ? 0 : 7
      break
  }
  return `${FILES[clamp(file)]}${RANKS[clamp(rank)]}` as Square
}

/** Where the cursor starts: in front of the king pawn of the side at the bottom. */
export const initialCursor = (orientation: Color): Square => (orientation === 'white' ? 'e2' : 'e7')

/** Board position of a square as percentages of the board, for overlays. */
export function squareBox(square: Square, orientation: Color): { left: number; top: number } {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number])
  const rank = RANKS.indexOf(square[1] as (typeof RANKS)[number])
  return orientation === 'white'
    ? { left: file * 12.5, top: (7 - rank) * 12.5 }
    : { left: (7 - file) * 12.5, top: rank * 12.5 }
}
