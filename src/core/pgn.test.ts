import { describe, expect, it } from 'vitest'
import {
  Position,
  createHistory,
  currentPosition,
  makePgn,
  parseUci,
  parsePgn,
  pushMove,
  type MoveHistory,
} from './index'

const OPERA = `[Event "Paris"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[Round "?"]
[White "Morphy, Paul"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 {This is a weak move} 4. dxe5 (4. Bc4 Nf6) 4... Bxf3
5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+
Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8
17. Rd8# 1-0
`

describe('parsePgn', () => {
  it('imports headers, mainline moves and result', () => {
    const result = parsePgn(OPERA)
    if (!result.ok) throw new Error(result.error[0]?.message)
    expect(result.value.headers.White).toBe('Morphy, Paul')
    expect(result.value.result).toBe('1-0')
    expect(result.value.history.entries).toHaveLength(33)
    expect(result.value.history.cursor).toBe(33)
    expect(result.value.history.entries[5]?.san).toBe('Bg4')
    const final = currentPosition(result.value.history)
    expect(final.status).toBe('checkmate')
    expect(final.winner).toBe('white')
  })

  it('reads castling as king two-square moves', () => {
    const result = parsePgn(OPERA)
    if (!result.ok) throw new Error('fixture')
    const castle = result.value.history.entries.find((e) => e.san === 'O-O-O')
    expect(castle?.move).toEqual({ from: 'e1', to: 'c1' })
  })

  it.each([
    ['1. d4 d5 2. Nc3 Nc6 3. Bf4 Bf5 4. Qd2 Qd7 5. O-O-O O-O-O *', 'c'],
    ['1. d4 d5 2. Nc3 Nc6 3. Bf4 Bf5 4. Qd2 Qd7 5. 0-0-0 0-0-0 *', 'c'],
    ['1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. O-O O-O *', 'g'],
    ['1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. 0-0 0-0 *', 'g'],
  ])('reads castling for both colors: %s', (pgn, file) => {
    const result = parsePgn(pgn)
    if (!result.ok) throw new Error(result.error[0]?.message)
    const [white, black] = result.value.history.entries.slice(-2)
    expect(white?.move).toEqual({ from: 'e1', to: `${file}1` })
    expect(black?.move).toEqual({ from: 'e8', to: `${file}8` })
    expect(white?.san).toBe(file === 'c' ? 'O-O-O' : 'O-O')
    expect(black?.san).toBe(white?.san)
  })

  it('starts from the FEN header', () => {
    const pgn = `[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]\n\n1. e4 Kd7 *`
    const result = parsePgn(pgn)
    if (!result.ok) throw new Error('fixture')
    expect(result.value.history.start.fen).toBe('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1')
    expect(result.value.history.entries.map((e) => e.san)).toEqual(['e4', 'Kd7'])
    expect(result.value.result).toBe('*')
  })

  it('accepts a bare movetext', () => {
    const result = parsePgn('1. d4 d5 2. c4')
    expect(result.ok && result.value.history.entries).toHaveLength(3)
  })

  it('accepts only the first game of several', () => {
    const result = parsePgn('1. e4 *\n\n[Event "Second"]\n\n1. d4 *')
    expect(result.ok && result.value.history.entries.map((e) => e.san)).toEqual(['e4'])
  })

  it('names the illegal move', () => {
    const result = parsePgn('1. e4 e5 2. Nf3 Nf3')
    expect(!result.ok && result.error[0]).toMatchObject({
      code: 'pgnIllegalMove',
      ply: 4,
      token: 'Nf3',
    })
  })

  it('rejects empty input', () => {
    for (const text of ['', '   \n ']) {
      const result = parsePgn(text)
      expect(!result.ok && result.error[0]?.code).toBe('pgnNoGame')
    }
  })

  it('rejects variants', () => {
    const result = parsePgn('[Variant "Atomic"]\n\n1. e4 *')
    expect(!result.ok && result.error[0]?.code).toBe('unsupportedVariant')
  })

  it('reports an invalid FEN header', () => {
    const result = parsePgn('[SetUp "1"]\n[FEN "8/8/8/8/8/8/8/8 w - - 0 1"]\n\n*')
    expect(!result.ok && result.error[0]?.code).toBe('missingKing')
  })
})

describe('makePgn', () => {
  const play = (start: Position, ...moves: string[]): MoveHistory =>
    moves.reduce((h, m) => {
      const move = parseUci(m)
      const next = move && pushMove(h, move)
      if (!next?.ok) throw new Error(m)
      return next.value
    }, createHistory(start))

  it('writes the roster, result and numbered SAN', () => {
    const pgn = makePgn(play(Position.start(), 'e2e4', 'e7e5', 'g1f3'), {
      headers: { White: 'Ann', Black: 'Bob' },
      result: '1/2-1/2',
    })
    expect(pgn).toContain('[White "Ann"]')
    expect(pgn).toContain('[Result "1/2-1/2"]')
    expect(pgn).toContain('1. e4 e5 2. Nf3 1/2-1/2')
    expect(pgn).not.toContain('[FEN')
  })

  it('records a custom start position, including Black to move', () => {
    const start = Position.fromFen('4k3/4p3/8/8/8/8/8/4K3 b - - 0 7')
    if (!start.ok) throw new Error('fixture')
    const pgn = makePgn(play(start.value, 'e7e5'))
    expect(pgn).toContain('[SetUp "1"]')
    expect(pgn).toContain('[FEN "4k3/4p3/8/8/8/8/8/4K3 b - - 0 7"]')
    expect(pgn).toContain('7... e5')
  })

  it('exports redo moves too, not just up to the cursor', () => {
    const history = play(Position.start(), 'e2e4', 'e7e5')
    expect(makePgn({ ...history, cursor: 1 })).toContain('1. e4 e5')
  })

  it('round-trips through parsePgn', () => {
    const original = play(Position.start(), 'e2e4', 'c7c5', 'g1f3', 'd7d6', 'f1b5')
    const parsed = parsePgn(makePgn(original, { headers: { Event: 'Test' } }))
    if (!parsed.ok) throw new Error('round trip failed')
    expect(parsed.value.headers.Event).toBe('Test')
    expect(parsed.value.history.entries.map((e) => e.move)).toEqual(
      original.entries.map((e) => e.move),
    )
    expect(currentPosition(parsed.value.history).fen).toBe(currentPosition(original).fen)
  })

  it('round-trips a custom start position', () => {
    const start = Position.fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    if (!start.ok) throw new Error('fixture')
    const original = play(start.value, 'e1g1', 'e8c8')
    const parsed = parsePgn(makePgn(original))
    if (!parsed.ok) throw new Error('round trip failed')
    expect(parsed.value.history.start.fen).toBe(start.value.fen)
    expect(currentPosition(parsed.value.history).fen).toBe(currentPosition(original).fen)
  })
})
