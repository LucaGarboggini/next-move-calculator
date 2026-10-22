/** Board themes are token sets in `ui/styles/tokens/board.css`, selected by `data-board-theme`. */
export const BOARD_THEMES = ['green', 'brown', 'blue'] as const
export type BoardThemeId = (typeof BOARD_THEMES)[number]
export const DEFAULT_BOARD_THEME: BoardThemeId = 'green'

/** Piece themes are CSS in `board/styles/pieces.css`, selected by `data-piece-theme`. */
export const PIECE_THEMES = ['classic', 'glyph'] as const
export type PieceThemeId = (typeof PIECE_THEMES)[number]
export const DEFAULT_PIECE_THEME: PieceThemeId = 'classic'
