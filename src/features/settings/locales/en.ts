export const en = {
  open: 'Settings',
  close: 'Close',
  title: 'Settings',
  description: 'Your choices are saved in this browser.',
  sections: {
    appearance: 'Appearance',
    board: 'Board and moves',
    engine: 'Engine',
    keyboard: 'Keyboard',
  },
  boardTheme: {
    label: 'Board colors',
    green: 'Green',
    brown: 'Brown',
    blue: 'Blue',
  },
  pieceTheme: {
    label: 'Pieces',
    classic: 'Classic',
    glyph: 'Text symbols',
  },
  notation: {
    label: 'Move notation',
    san: 'Standard (Nf3)',
    figurine: 'Figurine (♘f3)',
    uci: 'Coordinates (g1f3)',
  },
  autoQueen: {
    label: 'Always promote to a queen',
    hint: 'Skips the choice of piece when a pawn reaches the last rank.',
  },
  engine: {
    label: 'Engine size',
    lite: 'Lite',
    liteHint: 'About {{size}} MB. Quick to load and good on every device.',
    full: 'Full',
    fullHint: 'About {{size}} MB. The strongest. Downloaded once, then kept in this browser.',
    appliesNext: 'A change applies to the next calculation.',
  },
  fullWarning: {
    title: 'Use the Full engine?',
    description: 'It downloads about {{size}} MB the first time and needs more memory.',
    mobile:
      'This looks like a phone or tablet, where a large download and extra memory can slow the device down.',
    lowMemory: 'This device reports little memory.',
    singleThreaded:
      'This browser cannot run several threads here, so the Full engine will be slower than it could be.',
    confirm: 'Use Full',
    cancel: 'Keep Lite',
  },
  shortcuts: {
    label: 'Keyboard shortcuts',
    hint: 'Turn off if single-key shortcuts get in your way.',
    group: 'General',
    help: 'Show the keyboard shortcuts',
    show: 'View shortcuts',
    title: 'Keyboard shortcuts',
    description: 'Shortcuts do not run while you type in a field or have a dialog open.',
    empty: 'There are no shortcuts to show.',
    off: 'Keyboard shortcuts are turned off in the settings.',
  },
  reset: 'Restore defaults',
} as const

export type SettingsMessages = typeof en
