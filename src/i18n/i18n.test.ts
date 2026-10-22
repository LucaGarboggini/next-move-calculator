import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'
import { DEFAULT_LOCALE, detectLocale, i18n, registerTranslations, setLocale } from './index'

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'string' ? [prefix + k] : keys(v as object, `${prefix}${k}.`),
  )
}

describe('i18n', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE))

  it('has the same keys in every locale', () => {
    expect(keys(ptBR).sort()).toEqual(keys(en).sort())
  })

  it('has no empty translations', () => {
    const values = (obj: object): string[] =>
      Object.values(obj).flatMap((v) => (typeof v === 'string' ? [v] : values(v as object)))
    expect([...values(en), ...values(ptBR)].filter((v) => v.trim() === '')).toEqual([])
  })

  it('translates and switches language', async () => {
    expect(i18n.t('app.title')).toBe(en.app.title)
    await setLocale('pt-BR')
    expect(i18n.t('app.title')).toBe(ptBR.app.title)
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('registers feature namespaces', async () => {
    registerTranslations('demo', { en: { hi: 'Hello' }, 'pt-BR': { hi: 'Olá' } })
    expect(i18n.t('hi', { ns: 'demo' })).toBe('Hello')
    await setLocale('pt-BR')
    expect(i18n.t('hi', { ns: 'demo' })).toBe('Olá')
  })

  it('detects the best supported locale', () => {
    expect(detectLocale(['pt-PT', 'en-US'])).toBe('pt-BR')
    expect(detectLocale(['pt-br'])).toBe('pt-BR')
    expect(detectLocale(['fr-FR', 'en-GB'])).toBe('en')
    expect(detectLocale(['fr-FR'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
})
