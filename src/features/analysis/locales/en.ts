/** English strings of the analysis feature (namespace "analysis"). pt-BR must provide exactly these keys. */
export const en = {
  panels: {
    analysis: 'Analysis',
    settings: 'Search settings',
  },
  actions: {
    calculate: 'Calculate',
    stop: 'Stop',
  },
  toMove: {
    white: 'White to move',
    black: 'Black to move',
  },
  blocked: {
    invalid: 'Fix the position to calculate a move.',
    checkmate: 'Checkmate: there is no move to calculate.',
    stalemate: 'Stalemate: there is no move to calculate.',
  },
  status: {
    idle: 'Press Calculate to find the best move.',
    loading: 'Starting the engine…',
    searching: 'Calculating…',
    completed: 'Done.',
    stopped: 'Stopped.',
    backgrounded: 'Paused because the tab was in the background. Press Calculate to restart.',
    error: 'The engine failed: {{message}}',
  },
  eval: {
    bar: 'Who’s winning',
    summary: 'Evaluation {{value}}: {{advantage}}',
    whiteAhead: 'White is ahead',
    blackAhead: 'Black is ahead',
    equal: 'Equal',
    whiteWon: 'White has won',
    blackWon: 'Black has won',
    none: 'No evaluation yet',
  },
  best: {
    label: 'Best move',
    play: 'Play {{move}}',
  },
  stats: {
    label: 'Search statistics',
    depth: 'Depth',
    speed: 'Speed',
    speedUnit: '{{value}} n/s',
    nodes: 'Nodes',
    time: 'Time',
  },
  lines: {
    label: 'Engine lines',
    line: 'Line {{index}}',
    depth: 'depth {{depth}}',
    play: 'Play {{line}}',
    empty: 'No lines yet.',
  },
  settings: {
    time: {
      label: 'Time per search',
      value: '{{seconds}} s',
      infinite: 'Until stopped',
    },
    depth: {
      label: 'Depth limit',
      placeholder: 'No limit',
      hint: 'The search ends at the time or depth limit, whichever comes first.',
    },
    multiPv: {
      label: 'Lines',
      option: '{{count}} lines',
    },
    threads: {
      label: 'Threads',
      hint: 'Recommended for this device: {{count}}.',
    },
    hash: {
      label: 'Hash memory',
      option: '{{mb}} MB',
    },
    singleThreaded: 'This browser runs the engine on a single thread.',
    reset: 'Restore defaults',
    appliesNext: 'Changes apply to the next calculation.',
  },
  shortcuts: {
    group: 'Analysis',
    toggle: 'Calculate, or stop the calculation',
  },
}

export type AnalysisMessages = typeof en
