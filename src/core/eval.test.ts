import { describe, expect, it } from 'vitest'
import { formatEval, toWhiteScore } from './index'

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
