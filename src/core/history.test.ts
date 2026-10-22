import { describe, expect, it } from 'vitest'
import {
  Position,
  canRedo,
  canUndo,
  createHistory,
  currentPosition,
  goTo,
  goToEnd,
  goToStart,
  parseUci,
  playedEntries,
  pushMove,
  redo,
  undo,
  type Move,
  type MoveHistory,
} from './index'

const move = (text: string): Move => {
  const parsed = parseUci(text)
  if (!parsed) throw new Error(text)
  return parsed
}
const pushAll = (history: MoveHistory, ...moves: string[]): MoveHistory =>
  moves.reduce((h, m) => {
    const next = pushMove(h, move(m))
    if (!next.ok) throw new Error(`illegal ${m}`)
    return next.value
  }, history)

describe('MoveHistory', () => {
  it('starts empty', () => {
    const history = createHistory()
    expect(canUndo(history)).toBe(false)
    expect(canRedo(history)).toBe(false)
    expect(currentPosition(history).fen).toBe(Position.start().fen)
  })

  it('records moves with SAN and the resulting position', () => {
    const history = pushAll(createHistory(), 'e2e4', 'e7e5', 'g1f3')
    expect(history.entries.map((e) => e.san)).toEqual(['e4', 'e5', 'Nf3'])
    expect(history.cursor).toBe(3)
    expect(currentPosition(history).turn).toBe('black')
  })

  it('rejects illegal moves without changing the history', () => {
    const history = createHistory()
    const result = pushMove(history, move('e2e5'))
    expect(!result.ok && result.error.code).toBe('illegalMove')
  })

  it('undoes and redoes', () => {
    let history = pushAll(createHistory(), 'e2e4', 'e7e5')
    history = undo(history)
    expect(history.cursor).toBe(1)
    expect(canRedo(history)).toBe(true)
    expect(currentPosition(history).fen).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
    history = redo(history)
    expect(history.cursor).toBe(2)
    expect(canRedo(history)).toBe(false)
  })

  it('ignores undo at the start and redo at the end', () => {
    const empty = createHistory()
    expect(undo(empty)).toBe(empty)
    const full = pushAll(createHistory(), 'e2e4')
    expect(redo(full)).toBe(full)
  })

  it('replaying the next redo move keeps the redo stack', () => {
    let history = undo(pushAll(createHistory(), 'e2e4', 'e7e5'))
    history = pushAll(history, 'e7e5')
    expect(history.entries).toHaveLength(2)
    expect(history.cursor).toBe(2)
  })

  it('a different move after undo discards the redo stack', () => {
    let history = undo(pushAll(createHistory(), 'e2e4', 'e7e5'))
    history = pushAll(history, 'c7c5')
    expect(history.entries.map((e) => e.san)).toEqual(['e4', 'c5'])
    expect(canRedo(history)).toBe(false)
  })

  it('is immutable', () => {
    const before = pushAll(createHistory(), 'e2e4')
    undo(before)
    pushAll(before, 'e7e5')
    expect(before.cursor).toBe(1)
    expect(before.entries).toHaveLength(1)
  })

  it('jumps with goTo, clamped to the range', () => {
    const history = pushAll(createHistory(), 'e2e4', 'e7e5', 'g1f3')
    expect(goTo(history, 1).cursor).toBe(1)
    expect(goTo(history, -5).cursor).toBe(0)
    expect(goTo(history, 99).cursor).toBe(3)
    expect(goToStart(history).cursor).toBe(0)
    expect(goToEnd(goToStart(history)).cursor).toBe(3)
    expect(playedEntries(goTo(history, 2))).toHaveLength(2)
  })

  it('can start from any position', () => {
    const start = Position.fromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1')
    if (!start.ok) throw new Error('fixture')
    const history = pushAll(createHistory(start.value), 'e2e4')
    expect(history.entries[0]?.san).toBe('e4')
    expect(currentPosition(undo(history)).fen).toBe(start.value.fen)
  })
})
