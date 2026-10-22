import { describe, expect, it } from 'vitest'
import { startingSetup } from '@/core'
import { piecesFromEntries, placementFen } from './placement'

describe('placementFen', () => {
  it('writes the starting position', () => {
    expect(placementFen(startingSetup().pieces)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
  })

  it('writes an empty board and partial ranks', () => {
    expect(placementFen({})).toBe('8/8/8/8/8/8/8/8')
    expect(
      placementFen({ a1: { color: 'white', role: 'king' }, h8: { color: 'black', role: 'queen' } }),
    ).toBe('7q/8/8/8/8/8/8/K7')
    expect(
      placementFen({
        c3: { color: 'black', role: 'knight' },
        d3: { color: 'white', role: 'pawn' },
      }),
    ).toBe('8/8/8/8/8/2nP4/8/8')
  })
})

describe('piecesFromEntries', () => {
  it('keeps squares only and copies the pieces', () => {
    expect(
      piecesFromEntries([
        ['e4', { color: 'white', role: 'pawn', promoted: true } as never],
        ['a0', { color: 'white', role: 'king' }],
      ]),
    ).toEqual({ e4: { color: 'white', role: 'pawn' } })
  })
})
