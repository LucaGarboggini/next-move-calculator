import { describe, expect, it } from 'vitest'
import {
  EMPTY_FEN,
  STARTING_FEN,
  candidateEpSquares,
  emptySetup,
  makeFen,
  movePiece,
  parseFen,
  placePieces,
  sanitizeSetup,
  setCastlingRight,
  setEpSquare,
  setPiece,
  setTurn,
  startingSetup,
  type Setup,
} from './index'

const parsed = (fen: string): Setup => {
  const result = parseFen(fen)
  if (!result.ok) throw new Error(`parse failed: ${fen}`)
  return result.value
}

describe('FEN round-trip', () => {
  it.each([
    STARTING_FEN,
    EMPTY_FEN,
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'r3k2r/pppq1ppp/2npbn2/2b1p3/2B1P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 6 8',
    'r3k2r/8/8/8/8/8/8/R3K2R w Kq - 12 40',
    '4k3/8/8/8/8/8/8/4K3 b - - 99 120',
    '8/P6k/8/8/8/8/p6K/8 w - - 0 1',
  ])('parseFen then makeFen returns %s', (fen) => {
    expect(makeFen(parsed(fen))).toBe(fen)
  })

  it('starting setup is the standard position', () => {
    expect(makeFen(startingSetup())).toBe(STARTING_FEN)
  })

  it('accepts a FEN with missing trailing fields and surrounding whitespace', () => {
    expect(makeFen(parsed('  4k3/8/8/8/8/8/8/4K3 b  '))).toBe('4k3/8/8/8/8/8/8/4K3 b - - 0 1')
  })
})

describe('FEN syntax errors', () => {
  it.each([
    ['', 'fenBoard'],
    ['not a fen', 'fenTurn'],
    ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1', 'fenBoard'],
    ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1', 'fenBoard'],
    ['4k3/8/8/8/8/8/8/4K3 x - - 0 1', 'fenTurn'],
    ['4k3/8/8/8/8/8/8/4K3 w Z - 0 1', 'fenCastling'],
    ['4k3/8/8/8/8/8/8/4K3 w - e9 0 1', 'fenEnPassant'],
    ['4k3/8/8/8/8/8/8/4K3 w - - -1 1', 'fenHalfmoves'],
    ['4k3/8/8/8/8/8/8/4K3 w - - 0 x', 'fenFullmoves'],
    ['4k3/8/8/8/8/8/8/4K3 w - - 0 1 extra', 'fenFormat'],
  ])('rejects %j with %s', (fen, code) => {
    const result = parseFen(fen)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error[0]?.code).toBe(code)
  })

  it('rejects variants (pockets, remaining checks)', () => {
    for (const fen of [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[Qq] w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 3+3 0 1',
    ]) {
      const result = parseFen(fen)
      expect(!result.ok && result.error[0]?.code).toBe('unsupportedVariant')
    }
  })

  it('rejects castling rooks that are off their corner (Chess960)', () => {
    const result = parseFen('4k3/8/8/8/8/8/8/1R2K3 w B - 0 1')
    expect(!result.ok && result.error[0]?.code).toBe('unsupportedCastling')
  })
})

describe('editing helpers', () => {
  it('are immutable', () => {
    const start = startingSetup()
    const edited = setPiece(start, 'e2', undefined)
    expect(start.pieces.e2).toEqual({ color: 'white', role: 'pawn' })
    expect(edited.pieces.e2).toBeUndefined()
  })

  it('edit pieces, turn, castling and en passant', () => {
    let setup = emptySetup()
    setup = setPiece(setup, 'e1', { color: 'white', role: 'king' })
    setup = setPiece(setup, 'e8', { color: 'black', role: 'king' })
    setup = setTurn(setup, 'black')
    setup = setCastlingRight(setup, 'white', 'kingSide', true)
    setup = setEpSquare(setup, 'e3')
    expect(makeFen(setup)).toBe('4k3/8/8/8/8/8/8/4K3 b K e3 0 1')
  })

  it('offers en passant candidates only behind a just-pushed pawn', () => {
    const setup = parsed('4k3/8/8/8/4P3/8/8/4K3 b - - 0 1')
    expect(candidateEpSquares(setup)).toEqual(['e3'])
    expect(candidateEpSquares(setTurn(setup, 'white'))).toEqual([])
  })

  it('sanitizeSetup drops impossible castling rights and en passant squares', () => {
    const messy = setEpSquare(parsed('4k3/8/8/8/8/8/8/4K2R w KQkq - 0 1'), 'a6')
    expect(makeFen(sanitizeSetup(messy))).toBe('4k3/8/8/8/8/8/8/4K2R w K - 0 1')
  })
})

describe('moving pieces in the editor', () => {
  const CASTLING = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1'

  it.each([
    ['e1', 'c1', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/2KR3R w kq - 0 1'],
    ['e1', 'g1', 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 w kq - 0 1'],
    ['e8', 'c8', '2kr3r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQ - 0 1'],
    ['e8', 'g8', 'r4rk1/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQ - 0 1'],
  ] as const)(
    'castles %s-%s when the right allows it, using up that color’s rights',
    (from, to, fen) => {
      expect(makeFen(movePiece(parsed(CASTLING), from, to))).toBe(fen)
    },
  )

  it('does not castle without the right, or with a piece in between', () => {
    expect(makeFen(movePiece(parsed('4k3/8/8/8/8/8/8/R3K2R w K - 0 1'), 'e1', 'c1'))).toBe(
      '4k3/8/8/8/8/8/8/R1K4R w - - 0 1',
    )
    expect(makeFen(movePiece(parsed('4k3/8/8/8/8/8/8/RN2K2R w KQ - 0 1'), 'e1', 'c1'))).toBe(
      '4k3/8/8/8/8/8/8/RNK4R w - - 0 1',
    )
  })

  it('moves any other piece anywhere, replacing what is there', () => {
    expect(makeFen(movePiece(startingSetup(), 'd1', 'd7'))).toBe(
      'rnbqkbnr/pppQpppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1',
    )
    expect(movePiece(startingSetup(), 'e4', 'e5')).toEqual(startingSetup())
  })

  it('drops the castling rights the moved pieces can no longer hold', () => {
    expect(makeFen(movePiece(startingSetup(), 'a1', 'a3'))).toBe(
      'rnbqkbnr/pppppppp/8/8/8/R7/PPPPPPPP/1NBQKBNR w Kkq - 0 1',
    )
    expect(makeFen(movePiece(startingSetup(), 'e8', 'e6'))).toBe(
      'rnbq1bnr/pppppppp/4k3/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1',
    )
  })

  it('placePieces keeps only the castling rights the new pieces can hold', () => {
    const { pieces } = setPiece(startingSetup(), 'a1', undefined)
    expect(makeFen(placePieces(startingSetup(), pieces))).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w Kkq - 0 1',
    )
  })
})
