// Public API of the chess domain layer: pure TypeScript over chessops, plain data in and out.
export {
  COLORS,
  FILES,
  PROMOTION_ROLES,
  RANKS,
  ROLES,
  SQUARES,
  err,
  isSquare,
  ok,
  opposite,
  type Color,
  type File,
  type Piece,
  type PromotionRole,
  type Rank,
  type Result,
  type Role,
  type Square,
} from './types'
export { makeUci, movesEqual, parseUci, type Move } from './move'
export {
  ISSUE_CODES,
  createIssue,
  hasErrors,
  type IssueCode,
  type IssueSeverity,
  type ValidationIssue,
} from './issues'
export {
  CASTLING_SIDES,
  EMPTY_FEN,
  STARTING_FEN,
  candidateEpSquares,
  canHoldCastlingRight,
  emptySetup,
  isPossibleEpSquare,
  makeFen,
  parseFen,
  pieceCount,
  sanitizeSetup,
  setCastlingRight,
  setEpSquare,
  setPiece,
  setTurn,
  startingSetup,
  type CastlingSide,
  type Setup,
} from './setup'
export { isSetupValid, validateSetup } from './validation'
export { Position, type PositionStatus } from './position'
export {
  canRedo,
  canUndo,
  createHistory,
  currentPosition,
  goTo,
  goToEnd,
  goToStart,
  playedEntries,
  pushMove,
  redo,
  undo,
  type HistoryEntry,
  type MoveHistory,
} from './history'
export { makePgn, parsePgn, type GameResult, type MakePgnOptions, type PgnGame } from './pgn'
export { formatEval, toWhiteScore, type Score, type WhiteScore } from './eval'
