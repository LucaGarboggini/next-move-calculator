// Public API of the board layer: `BoardView` interface, chessground adapter, React wrapper.
// Only this layer imports chessground.
export { Board, type BoardHandle, type BoardProps } from './Board'
export { PieceIcon, type PieceIconProps } from './PieceIcon'
export { PromotionPicker, type PromotionPickerProps } from './PromotionPicker'
export { createChessgroundView } from './chessground-adapter'
export {
  DEFAULT_VIEW_STATE,
  type BoardArrow,
  type BoardHighlight,
  type BoardMode,
  type BoardPieces,
  type BoardView,
  type BoardViewEvents,
  type BoardViewFactory,
  type BoardViewState,
  type Destinations,
  type EditTool,
  type OverlayTone,
} from './types'
export {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME,
  DEFAULT_PIECE_THEME,
  PIECE_THEMES,
  type BoardThemeId,
  type PieceThemeId,
} from './themes'
export {
  BOARD_NAMESPACE,
  boardTranslations,
  createBoardMessages,
  type BoardMessages,
  type Translate,
} from './messages'
export { BoardMessagesContext, useBoardMessages } from './messages-context'
