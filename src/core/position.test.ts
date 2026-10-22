import { describe, expect, it } from 'vitest'
import { Position, STARTING_FEN, makeUci, parseUci, type Move } from './index'

const fromFen = (fen: string): Position => {
  const result = Position.fromFen(fen)
  if (!result.ok) throw new Error(result.error.map((i) => i.message).join('; '))
  return result.value
}
const uci = (text: string): Move => {
  const move = parseUci(text)
  if (!move) throw new Error(`bad uci ${text}`)
  return move
}
const play = (position: Position, ...moves: string[]): Position =>
  moves.reduce((current, text) => {
    const next = current.play(uci(text))
    if (!next.ok) throw new Error(`illegal ${text}`)
    return next.value
  }, position)

describe('Position', () => {
  it('starts from the standard position', () => {
    const start = Position.start()
    expect(start.fen).toBe(STARTING_FEN)
    expect(start.turn).toBe('white')
    expect(start.legalMoves()).toHaveLength(20)
    expect(start.status).toBe('ongoing')
  })

  it('fromFen rejects illegal setups with every reason', () => {
    const result = Position.fromFen('8/8/8/8/8/8/8/8 w - - 0 1')
    expect(!result.ok && result.error.map((i) => i.code)).toEqual(['missingKing', 'missingKing'])
  })

  it('fromFen reports syntax errors', () => {
    const result = Position.fromFen('garbage')
    expect(result.ok).toBe(false)
  })

  it('accepts warnings (implausible but playable material)', () => {
    expect(Position.fromFen('4k3/pppppppp/p7/8/8/8/8/4K3 w - - 0 1').ok).toBe(true)
  })

  it('is immutable: play returns a new position', () => {
    const start = Position.start()
    const next = play(start, 'e2e4')
    expect(start.fen).toBe(STARTING_FEN)
    expect(next.turn).toBe('black')
  })

  it('only writes the en passant square when a capture is legal', () => {
    expect(play(Position.start(), 'e2e4').fen).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
    const withCapture = play(fromFen('4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1'), 'e2e4')
    expect(withCapture.fen).toBe('4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1')
  })

  it('exposes the setup for the editor', () => {
    const setup = play(Position.start(), 'e2e4').setup
    expect(setup.turn).toBe('black')
    expect(setup.pieces.e4).toEqual({ color: 'white', role: 'pawn' })
  })

  it('reports check, checkmate, stalemate and insufficient material', () => {
    expect(fromFen('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1').isCheck).toBe(true)
    const mate = fromFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1')
    expect(mate.status).toBe('checkmate')
    expect(mate.winner).toBe('white')
    expect(mate.legalMoves()).toEqual([])
    const stalemate = fromFen('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1')
    expect(stalemate.status).toBe('stalemate')
    expect(stalemate.winner).toBeUndefined()
    expect(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1').status).toBe('insufficientMaterial')
  })
})

describe('moves', () => {
  it('rejects illegal moves', () => {
    const start = Position.start()
    expect(start.isLegal(uci('e2e5'))).toBe(false)
    expect(start.isLegal(uci('e7e5'))).toBe(false)
    const result = start.play(uci('e2e5'))
    expect(!result.ok && result.error.code).toBe('illegalMove')
  })

  it('expands promotions into four moves and requires the piece', () => {
    const position = fromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')
    const promotions = position.legalMoves().filter((m) => m.from === 'a7')
    expect(promotions.map(makeUci).sort()).toEqual(['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r'])
    expect(position.isLegal(uci('a7a8'))).toBe(false)
    expect(position.isLegal(uci('a7a8q'))).toBe(true)
    expect(Position.start().isLegal(uci('e2e4q'))).toBe(false)
  })

  describe('castling uses king-two-squares notation (as UCI engines do)', () => {
    const castlingFen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'

    it('lists, accepts and plays e1g1 / e1c1', () => {
      const position = fromFen(castlingFen)
      const moves = position.legalMoves().map(makeUci)
      expect(moves).toContain('e1g1')
      expect(moves).toContain('e1c1')
      expect(moves).not.toContain('e1h1')
      expect(position.destinations().get('e1')).toEqual(expect.arrayContaining(['g1', 'c1']))
      expect(play(position, 'e1g1').fen).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
      expect(play(position, 'e1c1').fen).toBe('r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1')
    })

    it('rejects the king-takes-own-rook spelling', () => {
      expect(fromFen(castlingFen).isLegal(uci('e1h1'))).toBe(false)
    })

    it('forbids castling through check or out of check', () => {
      expect(
        fromFen('r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1').legalMoves().map(makeUci),
      ).not.toContain('e1g1')
      expect(
        fromFen('r3k2r/8/8/8/8/8/4r3/R3K2R w KQkq - 0 1').legalMoves().map(makeUci),
      ).not.toContain('e1c1')
    })

    it('works for Black too', () => {
      const position = fromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')
      expect(position.san(uci('e8g8'))).toBe('O-O')
      expect(play(position, 'e8c8').fen).toBe('2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2')
    })
  })

  it('handles en passant', () => {
    const position = fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
    expect(position.isLegal(uci('e5d6'))).toBe(true)
    expect(play(position, 'e5d6').fen).toBe('4k3/8/3P4/8/8/8/8/4K3 b - - 0 1')
  })

  it('updates counters and rights', () => {
    const next = play(Position.start(), 'g1f3', 'g8f6', 'f3g1')
    expect(next.fen).toBe('rnbqkb1r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 3 2')
  })
})

describe('SAN', () => {
  it('writes SAN with checks, captures, disambiguation and promotion', () => {
    const start = Position.start()
    expect(start.san(uci('e2e4'))).toBe('e4')
    expect(start.san(uci('g1f3'))).toBe('Nf3')
    expect(fromFen('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1').san(uci('e1g1'))).toBe('O-O')
    expect(fromFen('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1').san(uci('e1c1'))).toBe('O-O-O')
    expect(fromFen('R6R/3k4/8/8/8/8/8/4K3 w - - 0 1').san(uci('a8d8'))).toBe('Rad8+')
    expect(fromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1').san(uci('a7a8q'))).toBe('a8=Q+')
    expect(fromFen('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1').san(uci('a1a8'))).toBe('Ra8#')
    expect(fromFen('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1').san(uci('e4d5'))).toBe('exd5')
  })

  it('returns undefined SAN for illegal moves', () => {
    expect(Position.start().san(uci('e2e5'))).toBeUndefined()
  })

  it('parses SAN into domain moves (castling as e1g1)', () => {
    expect(Position.start().parseSan('Nf3')).toEqual(uci('g1f3'))
    expect(Position.start().parseSan(' e4 ')).toEqual(uci('e2e4'))
    expect(fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').parseSan('O-O')).toEqual(uci('e1g1'))
    expect(fromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1').parseSan('O-O-O')).toEqual(uci('e8c8'))
    expect(fromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1').parseSan('a8=N')).toEqual(uci('a7a8n'))
  })

  it('returns undefined for unreadable or illegal SAN', () => {
    expect(Position.start().parseSan('Ke4')).toBeUndefined()
    expect(Position.start().parseSan('nonsense')).toBeUndefined()
    expect(Position.start().parseSan('')).toBeUndefined()
  })

  it('converts an engine line to SAN and stops at the first illegal move', () => {
    const line = ['e2e4', 'e7e5', 'g1f3', 'b8c6'].map(uci)
    expect(Position.start().lineToSan(line)).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
    expect(Position.start().lineToSan(['e2e4', 'e2e4', 'd7d5'].map(uci))).toEqual(['e4'])
    expect(Position.start().lineToSan([])).toEqual([])
  })
})

describe('UCI', () => {
  it('parses and writes UCI', () => {
    expect(parseUci('e2e4')).toEqual({ from: 'e2', to: 'e4' })
    expect(parseUci('E7E8Q')).toEqual({ from: 'e7', to: 'e8', promotion: 'queen' })
    expect(makeUci({ from: 'a7', to: 'a8', promotion: 'knight' })).toBe('a7a8n')
    for (const text of ['', 'e2', 'e2e9', 'i2e4', 'e7e8k', 'e2e4e5', '0000', '(none)']) {
      expect(parseUci(text)).toBeUndefined()
    }
  })
})
