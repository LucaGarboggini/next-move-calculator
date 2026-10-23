import { useRef, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import type { Piece } from '@/core'
import type { BoardHandle } from './Board'

/**
 * How far (CSS px) a pointer may move before a press on a spare piece becomes a drag. Fingers
 * wobble more than a mouse or pen, and a tap that turned into a drag would be lost.
 */
const DRAG_SLOP = { touch: 10, pen: 6, mouse: 4 } as const

const dragSlop = (pointerType: string): number =>
  pointerType === 'touch' || pointerType === 'pen' ? DRAG_SLOP[pointerType] : DRAG_SLOP.mouse

interface Press {
  readonly pointerId: number
  readonly x: number
  readonly y: number
  readonly slop: number
}

export interface SparePieceDragHandlers {
  onPointerDown(event: PointerEvent<HTMLElement>): void
  onPointerMove(event: PointerEvent<HTMLElement>): void
  onPointerUp(): void
  onPointerCancel(): void
  onClickCapture(event: MouseEvent<HTMLElement>): void
}

/**
 * Pointer handlers for a spare-piece control (a palette button) that work the same for touch,
 * mouse and pen: pressing and moving drags a new piece onto `board`; a press that does not move
 * is left alone, so it stays an ordinary click (or tap) the control can use to pick the piece.
 *
 * The drag starts only once the pointer has moved, because the board takes over the gesture
 * from then on and, on touch screens, swallows the click that would otherwise follow. A drag
 * never counts as a click on the control, even in browsers (WebKit) that send one to where the
 * press started.
 */
export function useSparePieceDrag(
  board: RefObject<BoardHandle | null>,
  piece: Piece,
): SparePieceDragHandlers {
  const press = useRef<Press | null>(null)
  const dragging = useRef(false)

  /** Until the pointer is released, and the click that may follow it, the drag is in progress. */
  const startDrag = () => {
    dragging.current = true
    const ended = new AbortController()
    const end = () => {
      ended.abort()
      window.setTimeout(() => (dragging.current = false))
    }
    window.addEventListener('pointerup', end, { signal: ended.signal })
    window.addEventListener('pointercancel', end, { signal: ended.signal })
  }

  return {
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return
      press.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        slop: dragSlop(event.pointerType),
      }
      // Keep receiving moves when a fast mouse leaves the control before passing the slop.
      // Touch pointers are captured implicitly.
      if (event.pointerType !== 'touch') event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove(event) {
      const current = press.current
      if (current?.pointerId !== event.pointerId) return
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < current.slop) return
      press.current = null
      // Release so the board, not the control, gets the rest of the gesture.
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      startDrag()
      board.current?.dragNewPiece(piece, event.nativeEvent)
    },
    onPointerUp() {
      press.current = null
    },
    onPointerCancel() {
      press.current = null
    },
    onClickCapture(event) {
      if (!dragging.current) return
      event.preventDefault()
      event.stopPropagation()
    },
  }
}
