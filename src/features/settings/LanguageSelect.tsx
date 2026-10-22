import { Globe } from 'lucide-react'
import { LOCALES, LOCALE_NAMES, useTranslation } from '@/i18n'
import { isLocalePreference, useLocaleStore } from '@/state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui'

/** UI language picker: follow the browser or force a supported locale. */
export function LanguageSelect() {
  const { t } = useTranslation()
  const preference = useLocaleStore((s) => s.preference)
  const setPreference = useLocaleStore((s) => s.setPreference)

  return (
    <Select
      value={preference}
      onValueChange={(value) => isLocalePreference(value) && setPreference(value)}
    >
      <SelectTrigger aria-label={t('settings.language.label')}>
        <Globe aria-hidden />
        <span className="max-sm:sr-only">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectItem value="system">{t('settings.language.system')}</SelectItem>
        {LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale} lang={locale}>
            {LOCALE_NAMES[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
