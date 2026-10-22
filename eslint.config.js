import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import storybook from 'eslint-plugin-storybook'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Layer boundaries (see docs/adr/0002-layered-architecture.md).
 *
 *   app → features → (ui, board, state, i18n) → (engine, core)
 *
 * `LAYERS` maps each module to the modules it may import. Everything else is
 * banned, as are deep imports into another module (only its public index.ts is
 * allowed) and third-party libraries outside their adapter.
 */
const FEATURES = ['editor', 'analysis', 'settings', 'saved-boards']
const LOWER = ['core', 'engine', 'board', 'ui', 'state', 'i18n']

const LAYERS = {
  core: [],
  engine: ['core'],
  board: ['core'],
  ui: [],
  i18n: [],
  state: ['core', 'engine', 'i18n'],
  ...Object.fromEntries(FEATURES.map((f) => [`features/${f}`, LOWER])),
  app: [...LOWER, ...FEATURES.map((f) => `features/${f}`)],
}

const ALL_MODULES = [...LOWER, ...FEATURES.map((f) => `features/${f}`), 'app']

/** Third-party libraries and the only modules allowed to import them. */
const VENDOR = [
  { name: 'chessground', paths: ['chessground'], allowedIn: ['board'] },
  { name: 'chessops', paths: ['chessops'], allowedIn: ['core', 'board'] },
  { name: 'stockfish', paths: ['stockfish'], allowedIn: ['engine'] },
]

function restrictionsFor(module) {
  const allowed = new Set([module, ...LAYERS[module]])
  const forbidden = ALL_MODULES.filter((m) => !allowed.has(m))

  const patterns = [
    ...forbidden.map((m) => ({
      group: [`@/${m}`, `**/${m}`],
      message: `Layer violation: "${module}" must not import "${m}" (app → features → ui/board/state → engine/core).`,
    })),
    // Only the public index.ts of another module may be imported.
    ...[...allowed]
      .filter((m) => m !== module)
      .map((m) => ({
        group: [`@/${m}/**`, `../**/${m}/**`],
        message: `Import "${m}" through its public index.ts, not its internals.`,
      })),
    ...forbidden.map((m) => ({
      group: [`@/${m}/**`, `../**/${m}/**`],
      message: `Layer violation: "${module}" must not import "${m}".`,
    })),
  ]

  const paths = VENDOR.filter((v) => !v.allowedIn.includes(module)).flatMap((v) =>
    v.paths.map((name) => ({
      name,
      message: `"${v.name}" may only be used inside ${v.allowedIn.join(' / ')} (adapter rule).`,
    })),
  )
  const vendorPatterns = VENDOR.filter((v) => !v.allowedIn.includes(module)).flatMap((v) =>
    v.paths.map((name) => ({
      group: [`${name}/*`],
      message: `"${v.name}" may only be used inside ${v.allowedIn.join(' / ')} (adapter rule).`,
    })),
  )

  return {
    'no-restricted-imports': ['error', { paths, patterns: [...patterns, ...vendorPatterns] }],
  }
}

export default defineConfig([
  globalIgnores(['dist', 'storybook-static', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx,js}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['vite.config.ts', 'playwright.config.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // shadcn-generated primitives export variants next to components.
  {
    files: ['src/ui/primitives/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Layer-boundary rules, one block per module.
  ...Object.keys(LAYERS).map((module) => ({
    files: [`src/${module}/**/*.{ts,tsx}`],
    rules: restrictionsFor(module),
  })),
])
