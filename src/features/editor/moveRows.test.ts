import { Position, createHistory, pushMove, type Move } from '@/core'
import { moveRows } from './moveRows'

function play(position: Position, moves: Move[]) {
  let game = createHistory(position)
  for (const move of moves) {
    const next = pushMove(game, move)
    if (!next.ok) throw new Error('illegal test move')
    game = next.value
  }
  return game
}

describe('moveRows', () => {
  it('numbers White and Black moves together', () => {
    const game = play(Position.start(), [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
    ])
    expect(moveRows(game)).toEqual([
      {
        number: 1,
        white: { ply: 1, san: 'e4' },
        black: { ply: 2, san: 'e5' },
      },
      { number: 2, white: { ply: 3, san: 'Nf3' }, black: undefined },
    ])
  })

  it('starts with a Black move at the right number', () => {
    const start = Position.fromFen('4k3/8/8/8/8/8/4P3/4K3 b - - 0 7')
    if (!start.ok) throw new Error('bad test fen')
    const game = play(start.value, [{ from: 'e8', to: 'e7' }])
    expect(moveRows(game)).toEqual([{ number: 7, white: undefined, black: { ply: 1, san: 'Ke7' } }])
  })

  it('is empty without moves', () => {
    expect(moveRows(createHistory())).toEqual([])
  })
})
