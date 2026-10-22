import { describe, expect, it } from 'vitest'
import { initialCursor, isCursorKey, moveCursor, squareBox } from './keyboard'

describe('moveCursor', () => {
  it('moves in screen directions for White', () => {
    expect(moveCursor('e4', 'ArrowUp', 'white')).toBe('e5')
    expect(moveCursor('e4', 'ArrowDown', 'white')).toBe('e3')
    expect(moveCursor('e4', 'ArrowRight', 'white')).toBe('f4')
    expect(moveCursor('e4', 'ArrowLeft', 'white')).toBe('d4')
  })

  it('flips for Black so up is still up on screen', () => {
    expect(moveCursor('e4', 'ArrowUp', 'black')).toBe('e3')
    expect(moveCursor('e4', 'ArrowDown', 'black')).toBe('e5')
    expect(moveCursor('e4', 'ArrowRight', 'black')).toBe('d4')
    expect(moveCursor('e4', 'ArrowLeft', 'black')).toBe('f4')
  })

  it('stops at the edges', () => {
    expect(moveCursor('a1', 'ArrowLeft', 'white')).toBe('a1')
    expect(moveCursor('a1', 'ArrowDown', 'white')).toBe('a1')
    expect(moveCursor('h8', 'ArrowRight', 'white')).toBe('h8')
    expect(moveCursor('h8', 'ArrowUp', 'white')).toBe('h8')
    expect(moveCursor('h8', 'ArrowLeft', 'black')).toBe('h8')
  })

  it('jumps to the screen edges with Home/End/PageUp/PageDown', () => {
    expect(moveCursor('d4', 'Home', 'white')).toBe('a4')
    expect(moveCursor('d4', 'End', 'white')).toBe('h4')
    expect(moveCursor('d4', 'PageUp', 'white')).toBe('d8')
    expect(moveCursor('d4', 'PageDown', 'white')).toBe('d1')
    expect(moveCursor('d4', 'Home', 'black')).toBe('h4')
    expect(moveCursor('d4', 'End', 'black')).toBe('a4')
    expect(moveCursor('d4', 'PageUp', 'black')).toBe('d1')
    expect(moveCursor('d4', 'PageDown', 'black')).toBe('d8')
  })

  it('recognises cursor keys only', () => {
    expect(isCursorKey('ArrowUp')).toBe(true)
    expect(isCursorKey('Enter')).toBe(false)
  })

  it('starts in front of the king pawn of the side at the bottom', () => {
    expect(initialCursor('white')).toBe('e2')
    expect(initialCursor('black')).toBe('e7')
  })
})

describe('squareBox', () => {
  it('places squares as percentages of the board, per orientation', () => {
    expect(squareBox('a8', 'white')).toEqual({ left: 0, top: 0 })
    expect(squareBox('h1', 'white')).toEqual({ left: 87.5, top: 87.5 })
    expect(squareBox('a8', 'black')).toEqual({ left: 87.5, top: 87.5 })
    expect(squareBox('h1', 'black')).toEqual({ left: 0, top: 0 })
  })
})
