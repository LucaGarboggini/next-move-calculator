import type { SearchLimits } from '../types'

/** A command sent to the engine. */
export type UciCommand =
  | { readonly type: 'uci' }
  | { readonly type: 'isready' }
  | { readonly type: 'ucinewgame' }
  | { readonly type: 'stop' }
  | { readonly type: 'quit' }
  | {
      readonly type: 'setoption'
      readonly name: string
      readonly value?: string | number | boolean
    }
  | { readonly type: 'position'; readonly fen: string }
  | { readonly type: 'go'; readonly limits: SearchLimits }

/** UCI is line-based: a newline inside an argument would inject a second command. */
function singleLine(text: string, what: string): string {
  if (/[\r\n]/.test(text)) throw new RangeError(`${what} must not contain line breaks`)
  return text.trim()
}

function positiveInt(value: number, what: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${what} must be a positive integer, got ${value}`)
  }
  return value
}

export function formatGo(limits: SearchLimits): string {
  const parts = ['go']
  if (limits.depth !== undefined) parts.push('depth', String(positiveInt(limits.depth, 'depth')))
  if (limits.nodes !== undefined) parts.push('nodes', String(positiveInt(limits.nodes, 'nodes')))
  if (limits.mate !== undefined) parts.push('mate', String(positiveInt(limits.mate, 'mate')))
  if (limits.movetimeMs !== undefined) {
    parts.push('movetime', String(positiveInt(Math.round(limits.movetimeMs), 'movetime')))
  }
  if (parts.length === 1) parts.push('infinite')
  return parts.join(' ')
}

/** Serialises a command to the line sent to the engine. Throws `RangeError` on invalid arguments. */
export function formatCommand(command: UciCommand): string {
  switch (command.type) {
    case 'uci':
    case 'isready':
    case 'ucinewgame':
    case 'stop':
    case 'quit':
      return command.type
    case 'setoption': {
      const name = singleLine(command.name, 'option name')
      if (command.value === undefined) return `setoption name ${name}`
      return `setoption name ${name} value ${singleLine(String(command.value), 'option value')}`
    }
    case 'position':
      return `position fen ${singleLine(command.fen, 'FEN')}`
    case 'go':
      return formatGo(command.limits)
  }
}
