import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { THEME_PREFERENCES, isThemePreference, useThemeStore, type ThemePreference } from '@/state'
import { ToggleGroup, ToggleGroupItem } from '@/ui'

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const satisfies Record<
  ThemePreference,
  unknown
>

/** System / light / dark switch. "System" is the default and follows the OS. */
export function ThemeToggle() {
  const { t } = useTranslation()
  const preference = useThemeStore((s) => s.preference)
  const setPreference = useThemeStore((s) => s.setPreference)

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={preference}
      // Radix emits "" when the active item is pressed again; keep the choice.
      onValueChange={(value) => isThemePreference(value) && setPreference(value)}
      aria-label={t('settings.theme.label')}
    >
      {THEME_PREFERENCES.map((option) => {
        const Icon = ICONS[option]
        return (
          <ToggleGroupItem key={option} value={option} aria-label={t(`settings.theme.${option}`)}>
            <Icon aria-hidden />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
