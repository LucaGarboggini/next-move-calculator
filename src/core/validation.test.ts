import { describe, expect, it } from 'vitest'
import { isSetupValid, parseFen, setPiece, validateSetup, type IssueCode } from './index'

const issuesFor = (fen: string) => {
  const setup = parseFen(fen)
  if (!setup.ok) throw new Error(`parse failed: ${fen}`)
  return validateSetup(setup.value)
}
const codes = (fen: string): IssueCode[] => issuesFor(fen).map((i) => i.code)

describe('validateSetup', () => {
  it('accepts the starting position and other legal positions without issues', () => {
    expect(codes('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toEqual([])
    expect(codes('4k3/8/8/8/8/8/8/4K3 w - - 0 1')).toEqual([])
    expect(codes('r3k2r/8/8/8/8/8/8/R3K2R b kq - 0 1')).toEqual([])
    expect(codes('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toEqual([])
  })

  it('accepts checkmate and stalemate positions', () => {
    expect(codes('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1')).toEqual([])
    expect(codes('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1')).toEqual([])
  })

  it('reports a missing king for each side', () => {
    const issues = issuesFor('8/8/8/8/8/8/8/8 w - - 0 1')
    expect(issues.map((i) => [i.code, i.color])).toEqual([
      ['missingKing', 'white'],
      ['missingKing', 'black'],
    ])
    expect(codes('4k3/8/8/8/8/8/8/8 w - - 0 1')).toEqual(['missingKing'])
  })

  it('reports more than one king', () => {
    const issues = issuesFor('4k3/8/8/8/8/8/8/K3K3 w - - 0 1')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ code: 'multipleKings', color: 'white' })
  })

  it('reports touching kings once', () => {
    expect(codes('8/8/8/3kK3/8/8/8/8 w - - 0 1')).toEqual(['kingsAdjacent'])
    expect(codes('8/8/8/8/8/8/k7/1K6 w - - 0 1')).toEqual(['kingsAdjacent'])
  })

  it('reports pawns on the first and last rank, with their squares', () => {
    const issues = issuesFor('P3k2P/8/8/8/8/8/8/p3K3 w - - 0 1')
    expect(issues.map((i) => [i.code, i.square])).toEqual([
      ['pawnsOnBackRank', 'a1'],
      ['pawnsOnBackRank', 'a8'],
      ['pawnsOnBackRank', 'h8'],
    ])
  })

  it('reports the side not to move being in check', () => {
    const issues = issuesFor('4k3/8/8/8/8/8/4R3/4K3 w - - 0 1')
    expect(issues.map((i) => [i.code, i.color])).toEqual([['sideNotToMoveInCheck', 'black']])
    expect(codes('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1')).toEqual([])
  })

  describe('castling rights', () => {
    it.each([
      ['4k3/8/8/8/8/8/8/4K3 w K - 0 1', 'white', 'kingSide'],
      ['4k3/8/8/8/8/8/8/4K2R w Q - 0 1', 'white', 'queenSide'],
      ['4k3/8/8/8/8/8/8/R3K3 w K - 0 1', 'white', 'kingSide'],
      ['r3k3/8/8/8/8/8/8/4K3 w k - 0 1', 'black', 'kingSide'],
      ['4k2r/8/8/8/8/8/8/R4K2 w Kk - 0 1', 'white', 'kingSide'],
    ])('rejects %s', (fen, color, side) => {
      expect(issuesFor(fen)).toContainEqual(
        expect.objectContaining({ code: 'invalidCastling', color, side }),
      )
    })

    it('rejects a rook of the wrong colour', () => {
      expect(codes('4k3/8/8/8/8/8/8/4K2r w K - 0 1')).toEqual(['invalidCastling'])
    })
  })

  describe('en passant', () => {
    it.each([
      ['4k3/8/8/8/8/8/8/4K3 w - e6 0 1', 'no pawn behind'],
      ['4k3/8/8/4p3/8/8/8/4K3 w - e3 0 1', 'wrong rank for the side to move'],
      ['4k3/8/4p3/4p3/8/8/8/4K3 w - e6 0 1', 'target square occupied'],
      ['4k3/4p3/8/4p3/8/8/8/4K3 w - e6 0 1', 'pawn origin square occupied'],
      ['4k3/8/8/4P3/8/8/8/4K3 w - e6 0 1', 'pawn of the wrong colour'],
    ])('rejects %s (%s)', (fen) => {
      expect(codes(fen)).toEqual(['invalidEnPassant'])
    })
  })

  describe('move counters', () => {
    it('rejects negative, fractional and zero values built by hand', () => {
      const base = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
      if (!base.ok) throw new Error('fixture')
      const issueCodes = (patch: object) =>
        validateSetup({ ...base.value, ...patch }).map((i) => i.code)
      expect(issueCodes({ halfmoves: -1 })).toEqual(['invalidHalfmoves'])
      expect(issueCodes({ halfmoves: 1.5 })).toEqual(['invalidHalfmoves'])
      expect(issueCodes({ fullmoves: 0 })).toEqual(['invalidFullmoves'])
    })
  })

  describe('warnings for implausible material', () => {
    it('warns about more than 8 pawns', () => {
      const issues = issuesFor('4k3/pppppppp/p7/8/8/8/PPPPPPPP/4K3 w - - 0 1')
      expect(issues.map((i) => [i.code, i.color, i.severity])).toEqual([
        ['tooManyPawns', 'black', 'warning'],
      ])
    })

    it('warns about more than 16 pieces', () => {
      const issues = issuesFor('4k3/8/8/8/QQQQQQQQ/NNNNNNNN/8/4K3 w - - 0 1')
      expect(issues.map((i) => i.code)).toContain('tooManyPieces')
    })

    it('warns about more promoted pieces than missing pawns allow', () => {
      const issues = issuesFor('4k3/8/8/8/8/8/PPPPPPPP/QQK5 w - - 0 1')
      expect(issues.map((i) => i.code)).toEqual(['tooManyPromotions'])
    })
  })

  it('warns about a check that could not have arisen', () => {
    const issues = issuesFor('4k3/8/8/8/8/3n1n2/8/r3K3 w - - 0 1')
    expect(issues.map((i) => [i.code, i.severity])).toEqual([['impossibleCheck', 'warning']])
  })

  it('collects several problems at once', () => {
    const found = codes('4k3/8/8/8/8/8/8/P3K2R w Q e6 0 1')
    expect(found).toEqual(
      expect.arrayContaining(['pawnsOnBackRank', 'invalidCastling', 'invalidEnPassant']),
    )
  })

  it('each issue carries a non-empty English fallback message', () => {
    for (const issue of issuesFor('P7/8/8/8/8/8/8/8 w K e6 0 1')) {
      expect(issue.message.length).toBeGreaterThan(5)
    }
  })

  it('reacts to edits made through setPiece', () => {
    const setup = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    if (!setup.ok) throw new Error('fixture')
    expect(isSetupValid(setup.value)).toBe(true)
    expect(isSetupValid(setPiece(setup.value, 'e8', undefined))).toBe(false)
  })
})
