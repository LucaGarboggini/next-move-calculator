import { createRef } from 'react'
import { fireEvent, render, within } from '@testing-library/react'
import type { Piece } from '@/core'
import type { BoardHandle } from './Board'
import { useSparePieceDrag } from './spare-piece'

const QUEEN: Piece = { color: 'white', role: 'queen' }

function setup() {
  const board = createRef<BoardHandle>() as { current: BoardHandle }
  const dragNewPiece = vi.fn<BoardHandle['dragNewPiece']>()
  board.current = { dragNewPiece }
  const onClick = vi.fn()
  function Spare() {
    return (
      <button type="button" onClick={onClick} {...useSparePieceDrag(board, QUEEN)}>
        queen
      </button>
    )
  }
  const { container } = render(<Spare />)
  return { button: within(container).getByRole('button'), dragNewPiece, onClick }
}

const pointer = (pointerType: string, clientX: number, clientY = 0, extra = {}) => ({
  pointerId: 1,
  pointerType,
  isPrimary: true,
  button: 0,
  clientX,
  clientY,
  ...extra,
})

describe('useSparePieceDrag', () => {
  it.each(['touch', 'mouse', 'pen'])('leaves a %s press without movement as a click', (type) => {
    const { button, dragNewPiece, onClick } = setup()
    fireEvent.pointerDown(button, pointer(type, 10, 10))
    fireEvent.pointerUp(button, pointer(type, 10, 10))
    fireEvent.click(button)
    expect(dragNewPiece).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each(['touch', 'mouse', 'pen'])('drags the piece once a %s moves away', (type) => {
    const { button, dragNewPiece } = setup()
    fireEvent.pointerDown(button, pointer(type, 10, 10))
    fireEvent.pointerMove(button, pointer(type, 10, 40))
    expect(dragNewPiece).toHaveBeenCalledOnce()
    expect(dragNewPiece.mock.calls[0]?.[0]).toEqual(QUEEN)
    expect(dragNewPiece.mock.calls[0]?.[1]).toMatchObject({ clientX: 10, clientY: 40 })

    // The board owns the gesture now: further moves do not start another drag.
    fireEvent.pointerMove(button, pointer(type, 10, 80))
    expect(dragNewPiece).toHaveBeenCalledOnce()
  })

  it('never counts a drag as a click on the control, but later clicks still work', async () => {
    const { button, dragNewPiece, onClick } = setup()
    fireEvent.pointerDown(button, pointer('mouse', 0))
    fireEvent.pointerMove(button, pointer('mouse', 50))
    expect(dragNewPiece).toHaveBeenCalledOnce()
    fireEvent.pointerUp(document.body, pointer('mouse', 50))
    // WebKit sends the click to where the press started.
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()

    await new Promise((resolve) => setTimeout(resolve))
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('tolerates a finger wobbling more than a mouse would', () => {
    const touch = setup()
    fireEvent.pointerDown(touch.button, pointer('touch', 0))
    fireEvent.pointerMove(touch.button, pointer('touch', 8))
    expect(touch.dragNewPiece).not.toHaveBeenCalled()

    const mouse = setup()
    fireEvent.pointerDown(mouse.button, pointer('mouse', 0))
    fireEvent.pointerMove(mouse.button, pointer('mouse', 8))
    expect(mouse.dragNewPiece).toHaveBeenCalledOnce()
  })

  it('ignores moves without a press, after the release, and from other pointers', () => {
    const { button, dragNewPiece } = setup()
    fireEvent.pointerMove(button, pointer('mouse', 50))
    fireEvent.pointerDown(button, pointer('touch', 0))
    fireEvent.pointerMove(button, pointer('touch', 50, 0, { pointerId: 2 }))
    fireEvent.pointerUp(button, pointer('touch', 0))
    fireEvent.pointerMove(button, pointer('touch', 50))
    fireEvent.pointerDown(button, pointer('touch', 0))
    fireEvent.pointerCancel(button, pointer('touch', 0))
    fireEvent.pointerMove(button, pointer('touch', 50))
    expect(dragNewPiece).not.toHaveBeenCalled()
  })

  it('does not drag with a secondary button or a second finger', () => {
    const { button, dragNewPiece } = setup()
    fireEvent.pointerDown(button, pointer('mouse', 0, 0, { button: 2 }))
    fireEvent.pointerMove(button, pointer('mouse', 50))
    fireEvent.pointerDown(button, pointer('touch', 0, 0, { isPrimary: false }))
    fireEvent.pointerMove(button, pointer('touch', 50))
    expect(dragNewPiece).not.toHaveBeenCalled()
  })
})
