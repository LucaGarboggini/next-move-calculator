// @vitest-environment node
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'

// The sample files don't exist on disk, so skip type-aware parsing; the layer
// rules are purely syntactic.
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfig: [
    tseslint.configs.disableTypeChecked,
    { languageOptions: { parserOptions: { projectService: false } } },
  ],
})

async function violations(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return (result?.messages ?? [])
    .filter((m) => m.ruleId === 'no-restricted-imports')
    .map((m) => m.message)
}

describe('layer-boundary lint rules', () => {
  const forbidden: [string, string, string][] = [
    ['core imports ui', 'src/core/x.ts', "import { cn } from '@/ui'\nexport const x = cn"],
    ['core imports engine', 'src/core/x.ts', "import '@/engine'"],
    ['ui imports core', 'src/ui/x.ts', "import '@/core'"],
    ['engine imports state', 'src/engine/x.ts', "import '@/state'"],
    ['board imports engine', 'src/board/x.ts', "import '@/engine'"],
    ['i18n imports state', 'src/i18n/x.ts', "import '@/state'"],
    ['ui imports i18n', 'src/ui/x.ts', "import '@/i18n'"],
    ['state imports ui', 'src/state/x.ts', "import '@/ui'"],
    ['lower layer imports features', 'src/ui/x.ts', "import '@/features/editor'"],
    ['lower layer imports app', 'src/state/x.ts', "import '@/app'"],
    ['feature imports app', 'src/features/editor/x.ts', "import '@/app'"],
    ['feature imports another feature', 'src/features/editor/x.ts', "import '@/features/analysis'"],
    ['relative import crosses a boundary', 'src/core/x.ts', "import '../ui'"],
    [
      'relative deep import crosses a boundary',
      'src/features/editor/x.ts',
      "import '../../../ui/primitives/button'",
    ],
    [
      'deep import into another module',
      'src/features/editor/x.ts',
      "import '@/ui/primitives/button'",
    ],
    ['chessground outside board', 'src/features/editor/x.ts', "import 'chessground'"],
    ['chessops outside core/board', 'src/engine/x.ts', "import 'chessops'"],
    ['stockfish outside engine', 'src/core/x.ts', "import 'stockfish'"],
  ]

  it.each(forbidden)('rejects: %s', async (_name, file, code) => {
    expect(await violations(file, code)).not.toHaveLength(0)
  })

  const allowed: [string, string, string][] = [
    [
      'feature imports lower layers',
      'src/features/editor/x.ts',
      "import '@/ui'\nimport '@/core'\nimport '@/state'\nimport '@/board'",
    ],
    ['app imports a feature public API', 'src/app/x.ts', "import '@/features/editor'"],
    ['state imports i18n', 'src/state/x.ts', "import '@/i18n'"],
    ['feature imports i18n', 'src/features/settings/x.ts', "import '@/i18n'"],
    ['engine imports core', 'src/engine/x.ts', "import '@/core'"],
    ['module imports its own internals', 'src/ui/x.ts', "import '@/ui/lib/utils'"],
    [
      'module imports a sibling file',
      'src/features/editor/x.ts',
      "import './y'\nimport '../editor/y'",
    ],
    ['chessground inside board', 'src/board/x.ts', "import 'chessground'"],
    ['chessops inside core', 'src/core/x.ts', "import 'chessops'"],
    ['stockfish inside engine', 'src/engine/x.ts', "import 'stockfish'"],
  ]

  it.each(allowed)('allows: %s', async (_name, file, code) => {
    expect(await violations(file, code)).toHaveLength(0)
  })
})
