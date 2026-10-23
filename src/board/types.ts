import type { Color, Move, Piece, Square } from '@/core'

/** Pieces by square: the same shape as `Setup.pieces` in core. */
export type BoardPieces = Readonly<Partial<Record<Square, Piece>>>

/** Legal target squares by origin square (see `Position.destinations()` in core). */
export type Destinations = ReadonlyMap<Square, readonly Square[]>

/**
 * - `view`: display only.
 * - `play`: legal moves for `movableColor`, limited to `destinations`.
 * - `edit`: pieces move freely, can be dragged off the board, and an `editTool`
 *   places or erases pieces on tap.
 */
export type BoardMode = 'view' | 'play' | 'edit'

export type OverlayTone = 'primary' | 'secondary' | 'danger' | 'neutral'

export interface BoardArrow {
  readonly from: Square
  readonly to: Square
  readonly tone: OverlayTone
  /** Thin arrows suit secondary engine lines. */
  readonly thin?: boolean
}

export interface BoardHighlight {
  readonly square: Square
  readonly tone: OverlayTone
}

export type EditTool =
  { readonly kind: 'place'; readonly piece: Piece } | { readonly kind: 'erase' } | null

/** Everything the board shows. The view never keeps state of its own beyond this. */
export interface BoardViewState {
  readonly pieces: BoardPieces
  readonly orientation: Color
  readonly mode: BoardMode
  /** `play` mode: the side allowed to move; nobody when undefined. */
  readonly movableColor: Color | undefined
  readonly destinations: Destinations
  readonly lastMove: readonly [Square, Square] | undefined
  /** Highlights the king of this color as in check. */
  readonly check: Color | undefined
  readonly arrows: readonly BoardArrow[]
  readonly highlights: readonly BoardHighlight[]
  readonly editTool: EditTool
  readonly coordinates: boolean
  readonly animations: boolean
}

export const DEFAULT_VIEW_STATE: BoardViewState = {
  pieces: {},
  orientation: 'white',
  mode: 'view',
  movableColor: undefined,
  destinations: new Map(),
  lastMove: undefined,
  check: undefined,
  arrows: [],
  highlights: [],
  editTool: null,
  coordinates: true,
  animations: true,
}

export interface BoardViewEvents {
  /** `play` mode: the user dropped a piece on a legal destination (promotion not chosen yet). */
  onMove?: (move: Pick<Move, 'from' | 'to'>) => void
  /**
   * `edit` mode: the pieces on the board changed because of the user. `move` is set when one
   * piece was moved from square to square (not for drops, tools or dragging a piece off), so the
   * host can apply rules such as castling; the board itself never moves a second piece.
   */
  onEdit?: (pieces: BoardPieces, move?: Pick<Move, 'from' | 'to'>) => void
  /** Any mode but `view`: the user selected a square. */
  onSquareSelect?: (square: Square) => void
}

/**
 * The board as the rest of the app sees it. Implemented by the chessground
 * adapter; features and the React wrapper depend only on this.
 */
export interface BoardView {
  /** Shows a new state; unspecified fields keep their previous value. */
  update(patch: Partial<BoardViewState>): void
  /** Keyboard equivalent of tapping a square (select, move, or apply the edit tool). */
  activateSquare(square: Square): void
  selectedSquare(): Square | undefined
  clearSelection(): void
  /** Starts dragging a new piece onto the board (edit mode palette). */
  dragNewPiece(piece: Piece, event: MouseEvent | TouchEvent): void
  destroy(): void
}

export type BoardViewFactory = (
  element: HTMLElement,
  state: BoardViewState,
  events: BoardViewEvents,
) => BoardView
