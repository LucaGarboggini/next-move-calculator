// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const STYLES = 'src/ui/styles'
const read = (file: string) => readFileSync(join(STYLES, file), 'utf8')

/** Custom properties declared inside the first block whose selector matches `selector`. */
function declarations(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No ${selector} block`)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start))
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  )
}

const light = declarations(read('tokens/colors.light.css'), ':root')
const dark = declarations(read('tokens/colors.dark.css'), '.dark')

/** Every top-level rule of a token file: selector text and its custom properties. */
function rules(css: string): { selector: string; tokens: Record<string, string> }[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    tokens: Object.fromEntries(
      [...m[2].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((d) => [d[1], d[2].trim()]),
    ),
  }))
}

const boardRules = rules(read('tokens/board.css'))
const board = Object.assign({}, ...boardRules.map((r) => r.tokens)) as Record<string, string>
const boardThemes = boardRules.filter((r) => r.selector.includes('data-board-theme'))

// --- WCAG contrast from oklch tokens -------------------------------------

function luminance(oklch: string): number {
  const m = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(oklch)
  if (!m) throw new Error(`Not an oklch color: ${oklch}`)
  const [L, C, h] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180]
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(bl)
}

function contrast(fg: string, bg: string): number {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [number, number]
  return (a + 0.05) / (b + 0.05)
}

const TEXT_PAIRS: [string, string][] = [
  ['--foreground', '--background'],
  ['--card-foreground', '--card'],
  ['--popover-foreground', '--popover'],
  ['--primary-foreground', '--primary'],
  ['--secondary-foreground', '--secondary'],
  ['--muted-foreground', '--background'],
  ['--muted-foreground', '--card'],
  ['--muted-foreground', '--muted'],
  ['--accent-foreground', '--accent'],
  ['--destructive-foreground', '--destructive'],
  ['--destructive', '--background'],
  ['--destructive', '--card'],
  ['--success-foreground', '--success'],
  ['--warning-foreground', '--warning'],
  ['--primary', '--background'],
  ['--sidebar-foreground', '--sidebar'],
  ['--sidebar-primary-foreground', '--sidebar-primary'],
  ['--sidebar-accent-foreground', '--sidebar-accent'],
]

const UI_PAIRS: [string, string][] = [
  ['--ring', '--background'],
  ['--ring', '--card'],
  ['--input', '--background'],
  ['--input', '--card'],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast (WCAG AA)', (_name, theme) => {
  it.each(TEXT_PAIRS)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(UI_PAIRS)('UI component %s against %s is at least 3:1', (fg, bg) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(3)
  })
})

describe('board themes', () => {
  const REQUIRED = [
    '--board-square-light',
    '--board-square-dark',
    '--board-coordinate-on-light',
    '--board-coordinate-on-dark',
  ]

  it('include green (the default), brown and blue', () => {
    const names = boardThemes.map((r) => /data-board-theme='([\w-]+)'/.exec(r.selector)?.[1])
    expect(names).toEqual(expect.arrayContaining(['green', 'brown', 'blue']))
  })

  it.each(boardThemes.map((r) => [r.selector, r.tokens] as const))(
    '%s defines the same tokens as every other theme and keeps coordinates legible',
    (_selector, tokens) => {
      expect(Object.keys(tokens).sort()).toEqual([...REQUIRED].sort())
      expect(
        contrast(tokens['--board-coordinate-on-light'], tokens['--board-square-light']),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrast(tokens['--board-coordinate-on-dark'], tokens['--board-square-dark']),
      ).toBeGreaterThanOrEqual(3)
    },
  )

  it('pieces stay visible on both square colors', () => {
    for (const theme of boardThemes) {
      for (const square of ['--board-square-light', '--board-square-dark']) {
        expect(contrast(board['--piece-glyph-black'], theme.tokens[square])).toBeGreaterThanOrEqual(
          3,
        )
      }
    }
    expect(
      contrast(board['--piece-glyph-white'], board['--piece-glyph-outline']),
    ).toBeGreaterThanOrEqual(3)
  })
})

// --- Theme structure -------------------------------------------------------

describe('theme token sets', () => {
  it('dark defines every token light defines, and vice versa', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort())
  })

  it('every Tailwind color maps to a defined token', () => {
    const defined = new Set([...Object.keys(light), ...Object.keys(board)])
    const mapped = [...read('theme.css').matchAll(/--color-[\w-]+:\s*var\((--[\w-]+)\)/g)].map(
      (m) => m[1],
    )
    expect(mapped.length).toBeGreaterThan(30)
    expect(mapped.filter((token) => !defined.has(token))).toEqual([])
  })
})

// --- No raw visual values outside token files ------------------------------

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory())
      return path.endsWith(join('ui', 'styles', 'tokens')) ? [] : sourceFiles(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

describe('design token discipline', () => {
  const RAW = [
    ['hex color', /#[0-9a-fA-F]{3,8}\b/],
    ['color function', /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/],
    ['arbitrary px/rem/em value', /-\[-?[\d.]+(?:px|rem|em)\]/],
    ['arbitrary color', /-\[(?:#|rgb|hsl|oklch|color-mix)/],
  ] as const

  const files = sourceFiles('src').filter(
    (f) =>
      // Token mapping and the shadcn-owned base keep their own definitions.
      !f.endsWith(join('ui', 'styles', 'theme.css')) &&
      !f.endsWith(join('ui', 'styles', 'tokens.css')),
  )

  it('scans real files', () => expect(files.length).toBeGreaterThan(40))

  it.each(RAW)('has no %s in components or stories', (_label, pattern) => {
    const offenders = files.filter((f) => pattern.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => relative('.', f))).toEqual([])
  })
})
