import { DEFAULT_NOTATION, NOTATIONS, formatMove, isNotation } from './notation'

describe('formatMove', () => {
  it('keeps standard algebraic notation as is', () => {
    expect(formatMove('san', 'Nf3', { from: 'g1', to: 'f3' })).toBe('Nf3')
  })

  it('replaces piece letters with figurines, including promotions', () => {
    expect(formatMove('figurine', 'Nf3', { from: 'g1', to: 'f3' })).toBe('♘f3')
    expect(formatMove('figurine', 'Qxe5+', { from: 'd4', to: 'e5' })).toBe('♕xe5+')
    expect(formatMove('figurine', 'exd8=Q#', { from: 'e7', to: 'd8', promotion: 'queen' })).toBe(
      'exd8=♕#',
    )
  })

  it('leaves pawn moves and castling alone', () => {
    expect(formatMove('figurine', 'e4', { from: 'e2', to: 'e4' })).toBe('e4')
    expect(formatMove('figurine', 'bxc3', { from: 'b2', to: 'c3' })).toBe('bxc3')
    expect(formatMove('figurine', 'O-O-O', { from: 'e1', to: 'c1' })).toBe('O-O-O')
  })

  it('writes UCI coordinates, with the promotion piece', () => {
    expect(formatMove('uci', 'Nf3', { from: 'g1', to: 'f3' })).toBe('g1f3')
    expect(formatMove('uci', 'e8=Q', { from: 'e7', to: 'e8', promotion: 'queen' })).toBe('e7e8q')
  })

  it('knows its notations', () => {
    expect(NOTATIONS).toContain(DEFAULT_NOTATION)
    expect(isNotation('figurine')).toBe(true)
    expect(isNotation('long')).toBe(false)
  })
})
