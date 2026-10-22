export const COLORS = ['white', 'black'] as const
export type Color = (typeof COLORS)[number]

export const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const
export type Role = (typeof ROLES)[number]

export const PROMOTION_ROLES = ['queen', 'rook', 'bishop', 'knight'] as const
export type PromotionRole = (typeof PROMOTION_ROLES)[number]

export interface Piece {
  readonly color: Color
  readonly role: Role
}

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export type File = (typeof FILES)[number]

export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
export type Rank = (typeof RANKS)[number]

export type Square = `${File}${Rank}`

/** All 64 squares, a1 … h8 (rank by rank, from White's side). */
export const SQUARES: readonly Square[] = RANKS.flatMap((rank) =>
  FILES.map((file): Square => `${file}${rank}`),
)

export const isSquare = (value: string): value is Square => /^[a-h][1-8]$/.test(value)

export const opposite = (color: Color): Color => (color === 'white' ? 'black' : 'white')

/** Success-or-failure value; the domain never throws for bad user input. */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
