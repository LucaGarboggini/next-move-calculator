import type { Color, Move, MoveHistory } from '@/core'

export interface MoveCell {
  /** Plies from the start position once this move is played (what `goToPly` takes). */
  readonly ply: number
  readonly san: string
  readonly move: Move
}

export interface MoveRow {
  readonly number: number
  /** Undefined when the list starts with a Black move. */
  readonly white: MoveCell | undefined
  readonly black: MoveCell | undefined
}

/** Groups the moves of a game into numbered rows ("12. Nf3 Nc6"), whoever moves first. */
export function moveRows(game: MoveHistory): MoveRow[] {
  const firstColor: Color = game.start.turn
  const offset = firstColor === 'black' ? 1 : 0
  const rows: { number: number; white?: MoveCell; black?: MoveCell }[] = []

  game.entries.forEach((entry, index) => {
    const slot = index + offset
    const number = game.start.fullmoves + Math.floor(slot / 2)
    let row = rows[rows.length - 1]
    if (!row || row.number !== number) {
      row = { number }
      rows.push(row)
    }
    const cell = { ply: index + 1, san: entry.san, move: entry.move }
    if (slot % 2 === 0) row.white = cell
    else row.black = cell
  })

  return rows.map((row) => ({ number: row.number, white: row.white, black: row.black }))
}
