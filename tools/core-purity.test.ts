import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const CORE = join(import.meta.dirname, '..', 'src', 'core')
const sources = readdirSync(CORE).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))

describe('core purity', () => {
  it('has source files to check', () => {
    expect(sources.length).toBeGreaterThan(5)
  })

  it.each(sources)('%s imports no React, DOM or browser-only code', (file) => {
    const code = readFileSync(join(CORE, file), 'utf8')
    const imports = [...code.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    for (const specifier of imports) {
      expect(specifier).not.toMatch(
        /^(react|react-dom|zustand|i18next|react-i18next|radix-ui)(\/|$)/,
      )
      expect(specifier).not.toMatch(/^@\//)
    }
    expect(code).not.toMatch(/\b(window|document|navigator|localStorage|sessionStorage|Worker)\b/)
  })
})
