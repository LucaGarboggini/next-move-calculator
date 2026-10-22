import { i18n } from '@/i18n'
import '@/features/analysis'
import '@/features/editor'
import '@/features/saved-boards'
import '@/features/settings'
import './providers/BoardI18nProvider'

type Bundle = Record<string, unknown>

function leaves(node: Bundle, prefix = ''): [string, string][] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[prefix + key, value] as [string, string]]
      : leaves(value as Bundle, `${prefix}${key}.`),
  )
}

const bundle = (locale: string, ns: string): Bundle => i18n.getResourceBundle(locale, ns) as Bundle

const namespaces = Object.keys(i18n.store.data.en ?? {}).sort()

/** Strings that are the same in English and Portuguese on purpose: only placeholders, units or names. */
const SAME_ON_PURPOSE = /^[\s,.:;]*(n\/s|MB|s|FEN|PGN|FEN e PGN|Stockfish|Threads)?[\s,.:;]*$/u
const withoutPlaceholders = (text: string) => text.replace(/{{\s*\w+\s*}}/g, '')
const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort()

describe('translations', () => {
  it('cover every feature namespace', () => {
    expect(namespaces).toEqual(
      expect.arrayContaining(['analysis', 'board', 'common', 'editor', 'savedBoards', 'settings']),
    )
  })

  it.each(namespaces)('"%s" has the same keys in en and pt-BR', (ns) => {
    const keys = (locale: string) =>
      leaves(bundle(locale, ns))
        .map(([key]) => key)
        .sort()
    expect(keys('pt-BR')).toEqual(keys('en'))
  })

  it.each(namespaces)('"%s" has no empty pt-BR strings and the same {{placeholders}}', (ns) => {
    const english = new Map(leaves(bundle('en', ns)))
    for (const [key, text] of leaves(bundle('pt-BR', ns))) {
      expect(text.trim(), `${ns}:${key} is empty`).not.toBe('')
      expect(placeholders(text), `${ns}:${key} placeholders`).toEqual(
        placeholders(english.get(key) ?? ''),
      )
    }
  })

  it.each(namespaces)('"%s" has no pt-BR string left in English', (ns) => {
    const english = new Map(leaves(bundle('en', ns)))
    const untranslated = leaves(bundle('pt-BR', ns))
      .filter(
        ([key, text]) =>
          text === english.get(key) && !SAME_ON_PURPOSE.test(withoutPlaceholders(text)),
      )
      .map(([key]) => `${ns}:${key}`)
    expect(untranslated).toEqual([])
  })
})
