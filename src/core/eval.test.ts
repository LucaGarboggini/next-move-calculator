import { describe, expect, it } from 'vitest'
import { formatEval, toWhiteScore, whiteShare } from './index'

describe('toWhiteScore', () => {
  it('flips centipawns when Black is to move', () => {
    expect(toWhiteScore({ kind: 'cp', cp: 35 }, 'white')).toEqual({ kind: 'cp', cp: 35 })
    expect(toWhiteScore({ kind: 'cp', cp: 35 }, 'black')).toEqual({ kind: 'cp', cp: -35 })
  })

  it('assigns mates to the right side', () => {
    expect(toWhiteScore({ kind: 'mate', moves: 3 }, 'white')).toEqual({
      kind: 'mate',
      winner: 'white',
      moves: 3,
    })
    expect(toWhiteScore({ kind: 'mate', moves: 3 }, 'black')).toEqual({
      kind: 'mate',
      winner: 'black',
      moves: 3,
    })
    expect(toWhiteScore({ kind: 'mate', moves: -2 }, 'white')).toEqual({
      kind: 'mate',
      winner: 'black',
      moves: 2,
    })
    expect(toWhiteScore({ kind: 'mate', moves: -2 }, 'black')).toEqual({
      kind: 'mate',
      winner: 'white',
      moves: 2,
    })
  })

  it('treats "mate 0" as the side to move being checkmated', () => {
    expect(toWhiteScore({ kind: 'mate', moves: 0 }, 'white')).toEqual({
      kind: 'mate',
      winner: 'black',
      moves: 0,
    })
    expect(toWhiteScore({ kind: 'mate', moves: 0 }, 'black')).toEqual({
      kind: 'mate',
      winner: 'white',
      moves: 0,
    })
  })
})

describe('formatEval', () => {
  it.each([
    [{ kind: 'cp', cp: 35 }, '+0.35'],
    [{ kind: 'cp', cp: -120 }, '-1.20'],
    [{ kind: 'cp', cp: 0 }, '0.00'],
    [{ kind: 'cp', cp: 100 }, '+1.00'],
    [{ kind: 'cp', cp: 5 }, '+0.05'],
    [{ kind: 'cp', cp: -5 }, '-0.05'],
    [{ kind: 'cp', cp: 1234 }, '+12.34'],
    [{ kind: 'cp', cp: 0.4 }, '0.00'],
    [{ kind: 'cp', cp: -0.4 }, '0.00'],
    [{ kind: 'mate', winner: 'white', moves: 3 }, '#3'],
    [{ kind: 'mate', winner: 'black', moves: 3 }, '#-3'],
    [{ kind: 'mate', winner: 'white', moves: 1 }, '#1'],
    [{ kind: 'mate', winner: 'white', moves: 0 }, '1-0'],
    [{ kind: 'mate', winner: 'black', moves: 0 }, '0-1'],
  ] as const)('formats %j as %s', (score, text) => {
    expect(formatEval(score)).toBe(text)
  })

  it('formats UCI scores end to end from the side to move', () => {
    expect(formatEval(toWhiteScore({ kind: 'cp', cp: 50 }, 'black'))).toBe('-0.50')
    expect(formatEval(toWhiteScore({ kind: 'mate', moves: 4 }, 'black'))).toBe('#-4')
  })
})

describe('whiteShare', () => {
  it('is one half when equal and symmetric between the colors', () => {
    expect(whiteShare({ kind: 'cp', cp: 0 })).toBe(0.5)
    expect(whiteShare({ kind: 'cp', cp: 150 }) + whiteShare({ kind: 'cp', cp: -150 })).toBeCloseTo(
      1,
    )
  })

  it("grows with White's advantage without ever reaching the ends on centipawns", () => {
    const shares = [-1500, -300, -50, 0, 50, 300, 1500].map((cp) => whiteShare({ kind: 'cp', cp }))
    expect([...shares].sort((a, b) => a - b)).toEqual(shares)
    expect(shares[0]).toBeGreaterThan(0)
    expect(shares[6]).toBeLessThan(1)
  })

  it('fills the bar completely for a forced mate, for whoever delivers it', () => {
    expect(whiteShare({ kind: 'mate', winner: 'white', moves: 4 })).toBe(1)
    expect(whiteShare({ kind: 'mate', winner: 'black', moves: 0 })).toBe(0)
  })
})
