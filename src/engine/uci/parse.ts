import { parseUci, type Move } from '@/core'
import type { UciInfo, UciMessage, UciOption, UciOptionType } from './messages'

const OPTION_TYPES: readonly string[] = ['check', 'spin', 'combo', 'button', 'string']

/** Integer token, or undefined when missing or not a number. */
function int(token: string | undefined): number | undefined {
  if (token === undefined) return undefined
  const value = Number(token)
  return Number.isInteger(value) ? value : undefined
}

/** `(none)` and `0000` mean "no move" in UCI. */
function moveOrUndefined(token: string | undefined): Move | undefined {
  return token === undefined ? undefined : parseUci(token)
}

/** Parses the tokens after `info`. Unknown keywords are skipped, so new engine fields are harmless. */
export function parseInfo(tokens: readonly string[]): UciInfo {
  const info: { -readonly [K in keyof UciInfo]: UciInfo[K] } = {}
  let i = 0
  while (i < tokens.length) {
    const key = tokens[i++]
    const next = tokens[i]
    switch (key) {
      case 'depth':
      case 'seldepth':
      case 'multipv':
      case 'nodes':
      case 'nps':
      case 'hashfull':
      case 'tbhits':
      case 'time':
      case 'currmovenumber': {
        const value = int(next)
        if (value !== undefined) info[key] = value
        i++
        break
      }
      case 'currmove': {
        const move = moveOrUndefined(next)
        if (move) info.currmove = move
        i++
        break
      }
      case 'score': {
        const kind = tokens[i]
        const value = int(tokens[i + 1])
        i += 2
        if (value !== undefined && (kind === 'cp' || kind === 'mate')) {
          info.score = kind === 'cp' ? { kind, cp: value } : { kind, moves: value }
        }
        if (tokens[i] === 'lowerbound' || tokens[i] === 'upperbound') {
          info.bound = tokens[i] === 'lowerbound' ? 'lower' : 'upper'
          i++
        }
        break
      }
      case 'string':
        info.string = tokens.slice(i).join(' ')
        i = tokens.length
        break
      case 'pv': {
        const pv: Move[] = []
        for (; i < tokens.length; i++) {
          const move = moveOrUndefined(tokens[i])
          if (!move) break
          pv.push(move)
        }
        info.pv = pv
        // Anything after a bad move is not part of the line; stop reading.
        i = tokens.length
        break
      }
      default:
        // `refutation`, `currline`, `wdl`, … : not used, skipped token by token.
        break
    }
  }
  return info
}

const OPTION_KEYWORDS = new Set(['name', 'type', 'default', 'min', 'max', 'var'])

/** Parses the tokens after `option`; names and values may contain spaces. */
export function parseOption(tokens: readonly string[]): UciOption | undefined {
  const parts: Record<string, string[]> = {}
  const vars: string[] = []
  let key: string | undefined
  let current: string[] = []
  const flush = () => {
    if (key === 'var') vars.push(current.join(' '))
    else if (key) parts[key] = current
  }
  for (const token of tokens) {
    if (OPTION_KEYWORDS.has(token)) {
      flush()
      key = token
      current = []
    } else {
      current.push(token)
    }
  }
  flush()

  const name = parts.name?.join(' ')
  const type = parts.type?.[0]
  if (!name || !type || !OPTION_TYPES.includes(type)) return undefined
  const min = int(parts.min?.[0])
  const max = int(parts.max?.[0])
  const defaultValue = parts.default?.join(' ')
  return {
    name,
    type: type as UciOptionType,
    ...(defaultValue !== undefined && { default: defaultValue }),
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    ...(vars.length > 0 && { vars }),
  }
}

/** Parses one line of engine output. Never throws; unrecognised lines become `unknown`. */
export function parseLine(line: string): UciMessage {
  const trimmed = line.trim()
  const tokens = trimmed.split(/\s+/)
  const [head, ...rest] = tokens
  switch (head) {
    case 'uciok':
      return { type: 'uciok' }
    case 'readyok':
      return { type: 'readyok' }
    case 'id': {
      const [field, ...value] = rest
      if ((field === 'name' || field === 'author') && value.length > 0) {
        return { type: 'id', field, value: value.join(' ') }
      }
      break
    }
    case 'option': {
      const option = parseOption(rest)
      if (option) return { type: 'option', option }
      break
    }
    case 'info':
      return { type: 'info', info: parseInfo(rest) }
    case 'bestmove': {
      const [move, keyword, ponder] = rest
      if (move === undefined) break
      const best = moveOrUndefined(move)
      const ponderMove = keyword === 'ponder' ? moveOrUndefined(ponder) : undefined
      if (!best && move !== '(none)' && move !== '0000') break
      return {
        type: 'bestmove',
        ...(best && { move: best }),
        ...(ponderMove && { ponder: ponderMove }),
      }
    }
  }
  return { type: 'unknown', line: trimmed }
}
