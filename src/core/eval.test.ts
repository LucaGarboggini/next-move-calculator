import { describe, expect, it } from 'vitest'
import { formatEval, formatEvalCompact, toWhiteScore, whiteShare } from './index'

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

describe('formatEvalCompact', () => {
  it.each([
    [{ kind: 'cp', cp: 35 }, '+0.4'],
    [{ kind: 'cp', cp: -120 }, '-1.2'],
    [{ kind: 'cp', cp: 0 }, '0.0'],
    [{ kind: 'cp', cp: 4 }, '0.0'],
    [{ kind: 'cp', cp: -4 }, '0.0'],
    [{ kind: 'cp', cp: 994 }, '+9.9'],
    [{ kind: 'cp', cp: 996 }, '+10'],
    [{ kind: 'cp', cp: -1234 }, '-12'],
    [{ kind: 'cp', cp: 15_000 }, '+150'],
    [{ kind: 'mate', winner: 'white', moves: 3 }, '#3'],
    [{ kind: 'mate', winner: 'black', moves: 12 }, '#-12'],
    [{ kind: 'mate', winner: 'black', moves: 0 }, '0-1'],
  ] as const)('formats %j as %s', (score, text) => {
    expect(formatEvalCompact(score)).toBe(text)
  })

  it('fits four characters for any centipawn score an engine reports in practice', () => {
    for (let cp = -9_999; cp <= 9_999; cp += 7) {
      expect(formatEvalCompact({ kind: 'cp', cp }).length).toBeLessThanOrEqual(4)
    }
  })
})

describe('whiteShare', () => {
  it("follows lichess's win-chance curve", () => {
    // lichess: winning chances = 2 / (1 + exp(-0.00368208 * cp)) - 1, shown as 50 + 50 * chances.
    expect(whiteShare({ kind: 'cp', cp: 100 })).toBeCloseTo(0.591, 3)
    expect(whiteShare({ kind: 'cp', cp: 300 })).toBeCloseTo(0.751, 3)
    expect(whiteShare({ kind: 'cp', cp: -300 })).toBeCloseTo(0.249, 3)
  })

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
