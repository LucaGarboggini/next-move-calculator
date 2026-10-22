/**
 * The only file that talks to chessground. It turns a `BoardViewState` into
 * chessground configuration and chessground events into `BoardViewEvents`.
 */
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Config } from 'chessground/config'
import type { DrawBrushes, DrawShape } from 'chessground/draw'
import type { Key, Piece as CgPiece } from 'chessground/types'
import { isSquare, type Piece, type Square } from '@/core'
import { piecesFromEntries, piecesKey, placementFen } from './placement'
import {
  DEFAULT_VIEW_STATE,
  type BoardArrow,
  type BoardView,
  type BoardViewFactory,
  type BoardViewState,
  type OverlayTone,
} from './types'

/** Colors are token references, so arrows follow the theme without redrawing. */
const BRUSH_COLOR: Record<OverlayTone, string> = {
  primary: 'var(--board-arrow-primary)',
  secondary: 'var(--board-arrow-secondary)',
  danger: 'var(--board-arrow-danger)',
  neutral: 'var(--board-arrow-neutral)',
}

const brush = (key: string, tone: OverlayTone, lineWidth: number) => ({
  key,
  color: BRUSH_COLOR[tone],
  opacity: 1,
  lineWidth,
})

/** Chessground requires its four default brush names; we reuse them for our tones. */
const BRUSHES: DrawBrushes = {
  green: brush('green', 'primary', 10),
  blue: brush('blue', 'secondary', 10),
  red: brush('red', 'danger', 10),
  yellow: brush('yellow', 'neutral', 10),
  'green-thin': brush('green-thin', 'primary', 5),
  'blue-thin': brush('blue-thin', 'secondary', 5),
  'red-thin': brush('red-thin', 'danger', 5),
  'yellow-thin': brush('yellow-thin', 'neutral', 5),
}

const BRUSH_BY_TONE: Record<OverlayTone, string> = {
  primary: 'green',
  secondary: 'blue',
  danger: 'red',
  neutral: 'yellow',
}

const arrowShape = (arrow: BoardArrow): DrawShape => ({
  orig: arrow.from,
  dest: arrow.to,
  brush: BRUSH_BY_TONE[arrow.tone] + (arrow.thin ? '-thin' : ''),
})

function toConfig(state: BoardViewState): Config {
  const interactive = state.mode !== 'view'
  const edit = state.mode === 'edit'
  const toolActive = edit && state.editTool !== null
  const freeMoves = edit && !toolActive

  const dests = new Map<Key, Key[]>()
  if (state.mode === 'play') {
    for (const [from, tos] of state.destinations) dests.set(from, [...tos])
  }

  const custom = new Map<Key, string>()
  for (const { square, tone } of state.highlights) custom.set(square, `hl-${tone}`)

  return {
    fen: placementFen(state.pieces),
    orientation: state.orientation,
    turnColor: state.movableColor ?? state.orientation,
    coordinates: state.coordinates,
    check: state.check ?? false,
    lastMove: state.lastMove ? [...state.lastMove] : undefined,
    // Dragging on the board must never scroll the page, but a display-only board may scroll.
    blockTouchScroll: interactive,
    // In the editor a king moved two files is just a king; do not move the rook.
    autoCastle: !edit,
    animation: { enabled: state.animations, duration: 200 },
    highlight: { lastMove: true, check: true, custom },
    movable: {
      free: freeMoves,
      color: state.mode === 'play' ? state.movableColor : freeMoves ? 'both' : undefined,
      dests: state.mode === 'play' ? dests : new Map(),
      showDests: true,
    },
    premovable: { enabled: false },
    predroppable: { enabled: false },
    draggable: { enabled: interactive && !toolActive, deleteOnDropOff: edit, showGhost: true },
    selectable: { enabled: interactive && !toolActive },
    // No right-click-only actions: users cannot draw their own shapes.
    drawable: {
      enabled: false,
      visible: true,
      autoShapes: state.arrows.map(arrowShape),
      brushes: BRUSHES,
    },
  }
}

export const createChessgroundView: BoardViewFactory = (element, initial, events) => {
  let state: BoardViewState = { ...DEFAULT_VIEW_STATE, ...initial }
  let lastKey = piecesKey(state.pieces)

  // Chessground reports changes asynchronously, so programmatic updates are told apart from
  // user edits by comparing against the last pieces we showed or reported.
  const emitEdit = (cg: Api) => {
    if (state.mode !== 'edit') return
    const pieces = piecesFromEntries(
      [...cg.state.pieces].filter(([key]) => isSquare(key)).map(([k, p]) => [k, p]),
    )
    const key = piecesKey(pieces)
    if (key === lastKey) return
    lastKey = key
    events.onEdit?.(pieces)
  }

  const applyTool = (cg: Api, square: Square) => {
    const tool = state.editTool
    if (!tool) return
    const piece: CgPiece | undefined = tool.kind === 'place' ? { ...tool.piece } : undefined
    cg.setPieces(new Map([[square, piece]]))
    emitEdit(cg)
  }

  const initialConfig = toConfig(state)
  const cg: Api = Chessground(element, {
    ...initialConfig,
    // Chessground only creates the drag ghost if dragging is enabled at start-up.
    draggable: { ...initialConfig.draggable, enabled: true },
    events: {
      change: () => emitEdit(cg),
      dropNewPiece: () => emitEdit(cg),
      select: (key) => {
        if (!isSquare(key)) return
        if (state.mode === 'edit' && state.editTool) applyTool(cg, key)
        else if (state.mode !== 'view') events.onSquareSelect?.(key)
      },
    },
    movable: {
      ...initialConfig.movable,
      events: {
        after: (from, to) => {
          if (state.mode === 'play' && isSquare(from) && isSquare(to)) events.onMove?.({ from, to })
        },
      },
    },
  })

  // Coordinates and the drag ghost are part of chessground's static DOM; re-set the real config.
  cg.set(initialConfig)

  return {
    update(patch) {
      const coordinatesChanged =
        patch.coordinates !== undefined && patch.coordinates !== state.coordinates
      state = { ...state, ...patch }
      cg.set(toConfig(state))
      if (coordinatesChanged) cg.redrawAll()
      lastKey = piecesKey(state.pieces)
    },
    activateSquare(square) {
      cg.selectSquare(square)
    },
    selectedSquare() {
      const selected = cg.state.selected
      return selected && isSquare(selected) ? selected : undefined
    },
    clearSelection() {
      cg.selectSquare(null)
    },
    dragNewPiece(piece: Piece, event) {
      cg.dragNewPiece({ ...piece }, event, true)
    },
    destroy() {
      cg.destroy()
      // chessground leaves its DOM and classes behind; the element may be reused (React StrictMode).
      element.replaceChildren()
      element.classList.remove('cg-wrap', 'manipulable', 'orientation-white', 'orientation-black')
    },
  } satisfies BoardView
}
