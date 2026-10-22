import { formatElapsed, formatNodes, formatSpeed, lineText, lineTokens } from './format'

describe('lineTokens', () => {
  it('numbers White moves, and a Black move that starts the line', () => {
    expect(lineTokens('white', 12, ['Nf3', 'Nc6', 'Bb5'])).toEqual([
      { index: 0, san: 'Nf3', number: '12.' },
      { index: 1, san: 'Nc6' },
      { index: 2, san: 'Bb5', number: '13.' },
    ])
    expect(lineTokens('black', 12, ['Nc6', 'Bb5', 'a6'])).toEqual([
      { index: 0, san: 'Nc6', number: '12...' },
      { index: 1, san: 'Bb5', number: '13.' },
      { index: 2, san: 'a6' },
    ])
  })

  it('has no tokens for an empty line', () => {
    expect(lineTokens('white', 1, [])).toEqual([])
  })
})

describe('lineText', () => {
  it('writes the line up to a move', () => {
    const tokens = lineTokens('black', 3, ['Nc6', 'Bb5', 'a6'])
    expect(lineText(tokens)).toBe('3... Nc6 4. Bb5 a6')
    expect(lineText(tokens, 2)).toBe('3... Nc6 4. Bb5')
    expect(lineText(tokens, 0)).toBe('')
  })
})

describe('number formatting', () => {
  it.each([
    [950, '950'],
    [12_345, '12.3k'],
    [250_000, '250k'],
    [1_400_000, '1.4M'],
  ])('formats speed %d as %s', (value, text) => {
    expect(formatSpeed(value)).toBe(text)
  })

  it('formats node counts up to billions', () => {
    expect(formatNodes(3_200_000)).toBe('3.2M')
    expect(formatNodes(2_500_000_000)).toBe('2.5B')
  })

  it.each([
    [400, '0.4 s'],
    [12_400, '12 s'],
    [65_000, '1:05'],
    [600_000, '10:00'],
  ])('formats %d ms as %s', (ms, text) => {
    expect(formatElapsed(ms)).toBe(text)
  })
})
