import { parseLine, parseInfo, parseOption } from './parse'
import type { UciMessage } from './messages'
import handshake from './__fixtures__/handshake.txt?raw'
import startpos from './__fixtures__/startpos.txt?raw'
import multipv from './__fixtures__/multipv.txt?raw'
import mateInThree from './__fixtures__/mate-in-3.txt?raw'
import beingMated from './__fixtures__/being-mated.txt?raw'
import checkmated from './__fixtures__/checkmated.txt?raw'
import stalemate from './__fixtures__/stalemate.txt?raw'

const parseAll = (text: string): UciMessage[] =>
  text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map(parseLine)

const infos = (text: string) =>
  parseAll(text).flatMap((m) => (m.type === 'info' && m.info.depth !== undefined ? [m.info] : []))

const last = <T>(items: T[]): T => {
  const item = items.at(-1)
  if (item === undefined) throw new Error('empty')
  return item
}

describe('parseLine (single lines)', () => {
  it('parses uciok and readyok', () => {
    expect(parseLine('uciok')).toEqual({ type: 'uciok' })
    expect(parseLine('readyok\r')).toEqual({ type: 'readyok' })
  })

  it('parses id lines with spaces in the value', () => {
    expect(parseLine('id name Stockfish 19 Lite WASM')).toEqual({
      type: 'id',
      field: 'name',
      value: 'Stockfish 19 Lite WASM',
    })
  })

  it('parses a full info line', () => {
    const message = parseLine(
      'info depth 12 seldepth 18 multipv 2 score cp -35 nodes 12345 nps 987654 hashfull 17 tbhits 3 time 99 pv e2e4 e7e5 g1f3',
    )
    expect(message).toEqual({
      type: 'info',
      info: {
        depth: 12,
        seldepth: 18,
        multipv: 2,
        score: { kind: 'cp', cp: -35 },
        nodes: 12345,
        nps: 987654,
        hashfull: 17,
        tbhits: 3,
        time: 99,
        pv: [
          { from: 'e2', to: 'e4' },
          { from: 'e7', to: 'e5' },
          { from: 'g1', to: 'f3' },
        ],
      },
    })
  })

  it('parses mate scores, positive and negative', () => {
    expect(parseInfo('score mate 3'.split(' ')).score).toEqual({ kind: 'mate', moves: 3 })
    expect(parseInfo('score mate -2'.split(' ')).score).toEqual({ kind: 'mate', moves: -2 })
    expect(parseInfo('score mate 0'.split(' ')).score).toEqual({ kind: 'mate', moves: 0 })
  })

  it('parses score bounds', () => {
    expect(parseInfo('score cp 40 lowerbound nodes 5'.split(' '))).toMatchObject({
      score: { kind: 'cp', cp: 40 },
      bound: 'lower',
      nodes: 5,
    })
    expect(parseInfo('score cp -40 upperbound'.split(' ')).bound).toBe('upper')
  })

  it('keeps promotions in the pv', () => {
    const { pv } = parseInfo('depth 3 pv e7e8q a1a2'.split(' '))
    expect(pv?.[0]).toEqual({ from: 'e7', to: 'e8', promotion: 'queen' })
  })

  it('reads info string to the end of the line', () => {
    expect(parseInfo('string NNUE evaluation using nn.nnue'.split(' ')).string).toBe(
      'NNUE evaluation using nn.nnue',
    )
  })

  it('parses currmove lines', () => {
    expect(parseInfo('depth 5 currmove e2e4 currmovenumber 1'.split(' '))).toMatchObject({
      currmove: { from: 'e2', to: 'e4' },
      currmovenumber: 1,
    })
  })

  it('ignores unknown keywords and malformed numbers instead of failing', () => {
    expect(parseInfo('depth x wdl 1 2 3 nodes 7 futurefield'.split(' '))).toEqual({ nodes: 7 })
  })

  it('stops the pv at the first token that is not a move', () => {
    expect(parseInfo('pv e2e4 nonsense e7e5'.split(' ')).pv).toEqual([{ from: 'e2', to: 'e4' }])
  })

  it('parses bestmove with and without ponder', () => {
    expect(parseLine('bestmove e2e4 ponder e7e5')).toEqual({
      type: 'bestmove',
      move: { from: 'e2', to: 'e4' },
      ponder: { from: 'e7', to: 'e5' },
    })
    expect(parseLine('bestmove a1a8')).toEqual({ type: 'bestmove', move: { from: 'a1', to: 'a8' } })
  })

  it('parses "no move" bestmoves', () => {
    expect(parseLine('bestmove (none)')).toEqual({ type: 'bestmove' })
    expect(parseLine('bestmove 0000')).toEqual({ type: 'bestmove' })
  })

  it('treats garbage as unknown, never throwing', () => {
    expect(parseLine('Stockfish 19 by the Stockfish developers')).toEqual({
      type: 'unknown',
      line: 'Stockfish 19 by the Stockfish developers',
    })
    expect(parseLine('bestmove')).toMatchObject({ type: 'unknown' })
    expect(parseLine('bestmove zz99')).toMatchObject({ type: 'unknown' })
    expect(parseLine('id')).toMatchObject({ type: 'unknown' })
    expect(parseLine('')).toMatchObject({ type: 'unknown' })
  })
})

describe('parseOption', () => {
  it('parses spin options', () => {
    expect(parseOption('name Hash type spin default 16 min 1 max 33554432'.split(' '))).toEqual({
      name: 'Hash',
      type: 'spin',
      default: '16',
      min: 1,
      max: 33554432,
    })
  })

  it('parses names with spaces and button options without default', () => {
    expect(parseOption('name Clear Hash type button'.split(' '))).toEqual({
      name: 'Clear Hash',
      type: 'button',
    })
  })

  it('parses combo vars', () => {
    expect(
      parseOption('name Style type combo default Normal var Solid var Normal var Risky'.split(' ')),
    ).toEqual({
      name: 'Style',
      type: 'combo',
      default: 'Normal',
      vars: ['Solid', 'Normal', 'Risky'],
    })
  })

  it('rejects options without a valid type', () => {
    expect(parseOption('name X type weird'.split(' '))).toBeUndefined()
    expect(parseOption('name X'.split(' '))).toBeUndefined()
  })
})

describe('recorded Stockfish 19 output', () => {
  it('handshake: id, all options, uciok; nothing is left unknown except the banner', () => {
    const messages = parseAll(handshake)
    expect(messages.find((m) => m.type === 'id' && m.field === 'name')).toMatchObject({
      value: 'Stockfish 19 Lite WASM',
    })
    const options = messages.flatMap((m) => (m.type === 'option' ? [m.option] : []))
    expect(options.map((o) => o.name)).toEqual(
      expect.arrayContaining(['Threads', 'Hash', 'MultiPV', 'Clear Hash', 'UCI_Elo']),
    )
    expect(options.find((o) => o.name === 'MultiPV')).toMatchObject({ type: 'spin', max: 256 })
    expect(messages.map((m) => m.type)).toContain('uciok')
    expect(messages.filter((m) => m.type === 'unknown')).toHaveLength(1)
  })

  it('start position: deepening infos end with a normal bestmove', () => {
    const lines = infos(startpos)
    expect(lines.map((i) => i.depth)).toEqual(
      [...lines.map((i) => i.depth)].sort((a, b) => a! - b!),
    )
    expect(last(lines).depth).toBe(8)
    expect(last(lines).score?.kind).toBe('cp')
    const end = last(parseAll(startpos))
    expect(end).toMatchObject({ type: 'bestmove' })
    expect(end).toHaveProperty('move')
  })

  it('multipv: three lines per depth, numbered 1..3', () => {
    const final = infos(multipv).filter((i) => i.depth === 8)
    expect(final.map((i) => i.multipv).sort()).toEqual([1, 2, 3])
    expect(final.every((i) => (i.pv?.length ?? 0) > 0)).toBe(true)
  })

  it('mate in 3: score mate 3 with a pv that starts with the best move', () => {
    const final = last(infos(mateInThree))
    expect(final.score).toEqual({ kind: 'mate', moves: 3 })
    const end = last(parseAll(mateInThree))
    expect(end).toMatchObject({ type: 'bestmove', move: { from: 'f6', to: 'a6' } })
    expect(final.pv?.[0]).toEqual({ from: 'f6', to: 'a6' })
  })

  it('being mated: negative mate score for the side to move', () => {
    expect(last(infos(beingMated)).score).toEqual({ kind: 'mate', moves: -1 })
  })

  it('checkmated and stalemated positions: no move, score at depth 0', () => {
    expect(last(parseAll(checkmated))).toEqual({ type: 'bestmove' })
    expect(last(infos(checkmated))).toMatchObject({ depth: 0, score: { kind: 'mate', moves: 0 } })
    expect(last(parseAll(stalemate))).toEqual({ type: 'bestmove' })
    expect(last(infos(stalemate))).toMatchObject({ depth: 0, score: { kind: 'cp', cp: 0 } })
  })

  it('every recorded line is understood (only the banner and info strings are free text)', () => {
    for (const text of [
      handshake,
      startpos,
      multipv,
      mateInThree,
      beingMated,
      checkmated,
      stalemate,
    ]) {
      const unknown = parseAll(text).filter((m) => m.type === 'unknown')
      expect(unknown.length).toBeLessThanOrEqual(1)
    }
  })
})
