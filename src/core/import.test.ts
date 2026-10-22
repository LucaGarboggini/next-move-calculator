import { importText } from './import'
import { currentPosition } from './history'
import { Position } from './position'
import { makeFen, STARTING_FEN } from './setup'

const FENS = [
  STARTING_FEN,
  '8/8/8/8/8/8/8/8 w - - 0 1',
  'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b Kq - 12 34',
  // en passant square without a capturing pawn is kept exactly as written
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2',
  // not legal, but still a well-formed FEN: the editor must show it and explain
  '8/8/8/8/8/8/8/8 b - - 0 1',
  'kk6/8/8/8/8/8/8/KK6 w - - 0 1',
]

describe('importText', () => {
  it.each(FENS)('reads and rewrites the FEN %s unchanged', (fen) => {
    const result = importText(fen)
    expect(result.ok && makeFen(result.value.setup)).toBe(fen)
    expect(result.ok && result.value.game).toBeNull()
  })

  it('round-trips every position of a played game', () => {
    let position = Position.start()
    for (let ply = 0; ply < 80; ply += 1) {
      const moves = position.legalMoves()
      const move = moves[(ply * 7 + 3) % moves.length]
      if (!move) break
      const next = position.play(move)
      if (!next.ok) throw new Error('legal move rejected')
      position = next.value
      const imported = importText(position.fen)
      expect(imported.ok && makeFen(imported.value.setup)).toBe(position.fen)
    }
  })

  it('accepts a FEN with trailing fields missing and surrounding whitespace', () => {
    const result = importText('  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq \n')
    expect(result.ok && makeFen(result.value.setup)).toBe(STARTING_FEN)
  })

  it('reads a PGN with its moves and stops at the last one', () => {
    const result = importText('1. e4 e5 2. Nf3 Nc6 *')
    expect(result.ok).toBe(true)
    if (!result.ok || !result.value.game) throw new Error('expected a game')
    expect(result.value.game.entries.map((e) => e.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    expect(makeFen(result.value.setup)).toBe(currentPosition(result.value.game).fen)
  })

  it('reads a PGN that starts from a FEN', () => {
    const result = importText('[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]\n\n1. e4 Kd7 *')
    expect(result.ok && result.value.game?.entries).toHaveLength(2)
  })

  it('explains what is wrong', () => {
    expect(importText('   ')).toMatchObject({ ok: false, error: [{ code: 'emptyInput' }] })
    expect(importText('8/8/8/8/8/8/8/8 x - - 0 1')).toMatchObject({
      ok: false,
      error: [{ code: 'fenTurn' }],
    })
    expect(importText('1. e4 e5 2. Ke3 *')).toMatchObject({
      ok: false,
      error: [{ code: 'pgnIllegalMove', ply: 3 }],
    })
    expect(importText('hello there')).toMatchObject({ ok: false, error: [{ code: 'pgnNoGame' }] })
  })
})
