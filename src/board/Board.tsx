import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type Ref,
} from 'react'
import type { Move, Piece, Square } from '@/core'
import { createChessgroundView } from './chessground-adapter'
import { initialCursor, isCursorKey, moveCursor, squareBox } from './keyboard'
import { useBoardMessages } from './messages-context'
import { PromotionPicker } from './PromotionPicker'
import {
  DEFAULT_BOARD_THEME,
  DEFAULT_PIECE_THEME,
  type BoardThemeId,
  type PieceThemeId,
} from './themes'
import {
  DEFAULT_VIEW_STATE,
  type BoardPieces,
  type BoardView,
  type BoardViewEvents,
  type BoardViewFactory,
  type BoardViewState,
} from './types'
import './styles/board.css'

export interface BoardHandle {
  /** Edit mode: start dragging a new piece (e.g. from a palette) onto the board. */
  dragNewPiece(piece: Piece, event: MouseEvent | TouchEvent): void
}

export interface BoardProps extends Partial<Omit<BoardViewState, 'pieces' | 'animations'>> {
  pieces: BoardPieces
  /** Defaults to off when the user prefers reduced motion. */
  animations?: boolean
  boardTheme?: BoardThemeId
  pieceTheme?: PieceThemeId
  /** `play` mode: the user chose a legal move (promotion piece included when needed). */
  onMove?: (move: Move) => void
  onEdit?: BoardViewEvents['onEdit']
  onSquareSelect?: BoardViewEvents['onSquareSelect']
  /** Swap the rendering engine (tests, alternative boards). */
  createView?: BoardViewFactory
  className?: string
  'aria-label'?: string
  ref?: Ref<BoardHandle>
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

const isPromotion = (piece: Piece | undefined, to: Square): boolean =>
  piece?.role === 'pawn' && to[1] === (piece.color === 'white' ? '8' : '1')

/**
 * The board. Fills its (square) parent, scales with it, and is controlled: it
 * shows exactly the props it is given, and reports what the user did. Touch,
 * mouse, pen and keyboard (arrows, Enter/Space, Escape, Delete) all work; the
 * visual layer is hidden from assistive technology and replaced by spoken
 * announcements.
 */
export function Board({
  pieces,
  orientation = DEFAULT_VIEW_STATE.orientation,
  mode = DEFAULT_VIEW_STATE.mode,
  movableColor,
  destinations = DEFAULT_VIEW_STATE.destinations,
  lastMove,
  check,
  arrows = DEFAULT_VIEW_STATE.arrows,
  highlights = DEFAULT_VIEW_STATE.highlights,
  editTool = DEFAULT_VIEW_STATE.editTool,
  coordinates = DEFAULT_VIEW_STATE.coordinates,
  animations,
  boardTheme = DEFAULT_BOARD_THEME,
  pieceTheme = DEFAULT_PIECE_THEME,
  onMove,
  onEdit,
  onSquareSelect,
  createView = createChessgroundView,
  className,
  'aria-label': ariaLabel,
  ref,
}: BoardProps) {
  const messages = useBoardMessages()
  const hintId = useId()
  const reducedMotion = usePrefersReducedMotion()

  const rootRef = useRef<HTMLDivElement>(null)
  const groundRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<BoardView>(null)
  const [resync, setResync] = useState(0)
  const [cursor, setCursor] = useState<Square>(() => initialCursor(orientation))
  const [focused, setFocused] = useState(false)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [pendingPromotion, setPendingPromotion] = useState<Pick<Move, 'from' | 'to'> | null>(null)

  const state = useMemo<BoardViewState>(
    () => ({
      pieces,
      orientation,
      mode,
      movableColor,
      destinations,
      lastMove,
      check,
      arrows,
      highlights,
      editTool,
      coordinates,
      animations: animations ?? !reducedMotion,
    }),
    [
      pieces,
      orientation,
      mode,
      movableColor,
      destinations,
      lastMove,
      check,
      arrows,
      highlights,
      editTool,
      coordinates,
      animations,
      reducedMotion,
    ],
  )

  // The view calls back asynchronously, so it always gets the latest props through refs.
  const latest = useRef({ state, onMove, onEdit, onSquareSelect })
  useLayoutEffect(() => {
    latest.current = { state, onMove, onEdit, onSquareSelect }
  })

  const announce = useCallback((text: string) => setAnnouncement(text), [])

  const commitMove = useCallback(
    (move: Move) => {
      const piece = latest.current.state.pieces[move.from]
      latest.current.onMove?.(move)
      if (piece) announce(messages.moved(piece, move.from, move.to))
      // If the host did not accept the move, this puts the pieces back.
      setResync((n) => n + 1)
    },
    [announce, messages],
  )

  const handleViewMove = useCallback(
    (move: Pick<Move, 'from' | 'to'>) => {
      if (isPromotion(latest.current.state.pieces[move.from], move.to)) setPendingPromotion(move)
      else commitMove(move)
    },
    [commitMove],
  )

  useEffect(() => {
    const element = groundRef.current
    if (!element) return
    const view = createView(element, latest.current.state, {
      onMove: handleViewMove,
      onEdit: (next) => latest.current.onEdit?.(next),
      onSquareSelect: (square) => latest.current.onSquareSelect?.(square),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [createView, handleViewMove])

  useEffect(() => {
    viewRef.current?.update(state)
  }, [state, resync])

  useImperativeHandle(ref, () => ({
    dragNewPiece: (piece, event) => viewRef.current?.dragNewPiece(piece, event),
  }))

  const describeSquare = (square: Square): string => {
    const piece = pieces[square]
    return piece ? messages.squareOccupied(square, piece) : messages.squareEmpty(square)
  }

  const activate = (square: Square) => {
    const view = viewRef.current
    if (!view || mode === 'view') return
    const before = view.selectedSquare()
    view.activateSquare(square)
    const after = view.selectedSquare()
    if (mode === 'edit' && editTool) {
      announce(
        editTool.kind === 'place'
          ? messages.placed(editTool.piece, square)
          : messages.removed(square),
      )
    } else if (after && after !== before) {
      announce(messages.selected(square, destinations.get(square)?.length ?? 0))
    } else if (!after && before && !destinations.get(before)?.includes(square)) {
      announce(messages.deselected)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || pendingPromotion) return
    setKeyboardActive(true)
    if (isCursorKey(event.key)) {
      event.preventDefault()
      const next = moveCursor(cursor, event.key, orientation)
      setCursor(next)
      announce(describeSquare(next))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(cursor)
    } else if (event.key === 'Escape') {
      viewRef.current?.clearSelection()
      announce(messages.deselected)
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && mode === 'edit') {
      event.preventDefault()
      if (!pieces[cursor]) return
      onEdit?.(Object.fromEntries(Object.entries(pieces).filter(([square]) => square !== cursor)))
      announce(messages.removed(cursor))
    }
  }

  const cancelPromotion = () => {
    setPendingPromotion(null)
    setResync((n) => n + 1)
    rootRef.current?.focus()
  }

  const { left, top } = squareBox(cursor, orientation)
  const promotionColor = pendingPromotion ? pieces[pendingPromotion.from]?.color : undefined

  return (
    <div
      ref={rootRef}
      data-slot="board"
      data-mode={mode}
      data-board-theme={boardTheme}
      data-piece-theme={pieceTheme}
      role="application"
      aria-label={ariaLabel ?? messages.label}
      aria-describedby={hintId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => setKeyboardActive(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`relative size-full touch-none rounded-sm outline-none select-none focus-visible:ring-3 focus-visible:ring-ring ${className ?? ''}`.trim()}
    >
      <div ref={groundRef} aria-hidden="true" className="size-full" />
      {focused && keyboardActive && (
        <div
          data-slot="board-cursor"
          aria-hidden="true"
          className="pointer-events-none absolute z-sticky size-[12.5%] ring-4 ring-ring ring-inset"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      )}
      <span id={hintId} className="sr-only">
        {messages.hint}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      {pendingPromotion && promotionColor && (
        <PromotionPicker
          color={promotionColor}
          pieceTheme={pieceTheme}
          onCancel={cancelPromotion}
          onChoose={(promotion) => {
            const move = { ...pendingPromotion, promotion }
            setPendingPromotion(null)
            commitMove(move)
            rootRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}
