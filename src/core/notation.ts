import { makeUci, type Move } from './move'

/** How moves are written: standard algebraic, algebraic with piece symbols, or UCI coordinates. */
export const NOTATIONS = ['san', 'figurine', 'uci'] as const
export type Notation = (typeof NOTATIONS)[number]
export const DEFAULT_NOTATION: Notation = 'san'

export const isNotation = (value: unknown): value is Notation =>
  NOTATIONS.includes(value as Notation)

const FIGURINES: Readonly<Record<string, string>> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
}

/** Writes a move in the chosen notation. `san` is the move's standard algebraic form. */
export function formatMove(notation: Notation, san: string, move: Move): string {
  switch (notation) {
    case 'san':
      return san
    case 'figurine':
      // Piece letters only ever appear first or after "=" (promotion); files are lowercase.
      return san.replace(/(^|=)([KQRBN])/, (_, lead: string, piece: string) => {
        return `${lead}${FIGURINES[piece] ?? piece}`
      })
    case 'uci':
      return makeUci(move)
  }
}
