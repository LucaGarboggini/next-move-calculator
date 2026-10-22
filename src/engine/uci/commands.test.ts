import { formatCommand, formatGo } from './commands'

describe('formatCommand', () => {
  it('serialises simple commands', () => {
    for (const type of ['uci', 'isready', 'ucinewgame', 'stop', 'quit'] as const) {
      expect(formatCommand({ type })).toBe(type)
    }
  })

  it('serialises setoption with and without value', () => {
    expect(formatCommand({ type: 'setoption', name: 'Hash', value: 64 })).toBe(
      'setoption name Hash value 64',
    )
    expect(formatCommand({ type: 'setoption', name: 'UCI_ShowWDL', value: true })).toBe(
      'setoption name UCI_ShowWDL value true',
    )
    expect(formatCommand({ type: 'setoption', name: 'Clear Hash' })).toBe(
      'setoption name Clear Hash',
    )
  })

  it('serialises position', () => {
    expect(formatCommand({ type: 'position', fen: '8/8/8/8/8/8/8/K6k w - - 0 1' })).toBe(
      'position fen 8/8/8/8/8/8/8/K6k w - - 0 1',
    )
  })

  it('refuses arguments that would inject a second command', () => {
    expect(() => formatCommand({ type: 'position', fen: 'x\ngo infinite' })).toThrow(RangeError)
    expect(() => formatCommand({ type: 'setoption', name: 'Hash', value: '1\nquit' })).toThrow(
      RangeError,
    )
    expect(() => formatCommand({ type: 'setoption', name: 'a\rb' })).toThrow(RangeError)
  })
})

describe('formatGo', () => {
  it('searches infinitely without limits', () => {
    expect(formatGo({})).toBe('go infinite')
  })

  it('combines limits', () => {
    expect(formatGo({ depth: 20 })).toBe('go depth 20')
    expect(formatGo({ mate: 3 })).toBe('go mate 3')
    expect(formatGo({ depth: 18, movetimeMs: 1500.4, nodes: 1000 })).toBe(
      'go depth 18 nodes 1000 movetime 1500',
    )
  })

  it('rejects non-positive or fractional limits', () => {
    expect(() => formatGo({ depth: 0 })).toThrow(RangeError)
    expect(() => formatGo({ depth: 1.5 })).toThrow(RangeError)
    expect(() => formatGo({ nodes: -1 })).toThrow(RangeError)
    expect(() => formatGo({ movetimeMs: Number.NaN })).toThrow(RangeError)
  })
})
