import { RotateCcw } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { BOARD_THEMES, PIECE_THEMES } from '@/board'
import { NOTATIONS } from '@/core'
import type { EngineCapabilities } from '@/engine'
import { useTranslation } from '@/i18n'
import { useLocaleStore, useSettings, useThemeStore } from '@/state'
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/ui'
import { EngineSizeSetting } from './EngineSizeSetting'
import { SETTINGS_NAMESPACE } from './i18n'
import { SwitchRow } from './SwitchRow'
import { LanguageSelect } from './LanguageSelect'
import { ThemeToggle } from './ThemeToggle'

const isOneOf = <T extends string>(options: readonly T[], value: string): value is T =>
  options.includes(value as T)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label id={id}>{label}</Label>
      {children}
    </div>
  )
}

export interface SettingsFormProps {
  capabilities?: EngineCapabilities
}

/** Every preference in one place: appearance, board and moves, engine size and the keyboard. */
export function SettingsForm({ capabilities }: SettingsFormProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  const { t: common } = useTranslation()
  const id = useId()
  const settings = useSettings()

  const restoreDefaults = () => {
    settings.reset()
    useThemeStore.getState().setPreference('system')
    useLocaleStore.getState().setPreference('system')
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title={t('sections.appearance')}>
        <Field id={`${id}-language`} label={common('settings.language.label')}>
          <LanguageSelect />
        </Field>
        <Field id={`${id}-theme`} label={common('settings.theme.label')}>
          <ThemeToggle />
        </Field>
        <Field id={`${id}-board`} label={t('boardTheme.label')}>
          <Select
            value={settings.boardTheme}
            onValueChange={(value) =>
              isOneOf(BOARD_THEMES, value) && settings.update({ boardTheme: value })
            }
          >
            <SelectTrigger aria-labelledby={`${id}-board`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {t(`boardTheme.${theme}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={`${id}-pieces`} label={t('pieceTheme.label')}>
          <Select
            value={settings.pieceTheme}
            onValueChange={(value) =>
              isOneOf(PIECE_THEMES, value) && settings.update({ pieceTheme: value })
            }
          >
            <SelectTrigger aria-labelledby={`${id}-pieces`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIECE_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {t(`pieceTheme.${theme}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Separator />

      <Section title={t('sections.board')}>
        <Field id={`${id}-notation`} label={t('notation.label')}>
          <Select
            value={settings.notation}
            onValueChange={(value) =>
              isOneOf(NOTATIONS, value) && settings.update({ notation: value })
            }
          >
            <SelectTrigger aria-labelledby={`${id}-notation`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTATIONS.map((notation) => (
                <SelectItem key={notation} value={notation}>
                  {t(`notation.${notation}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <SwitchRow
          label={t('autoQueen.label')}
          hint={t('autoQueen.hint')}
          checked={settings.autoQueen}
          onCheckedChange={(autoQueen) => settings.update({ autoQueen })}
        />
      </Section>

      <Separator />

      <Section title={t('sections.engine')}>
        <EngineSizeSetting {...(capabilities && { capabilities })} />
      </Section>

      <Separator />

      <Section title={t('sections.keyboard')}>
        <SwitchRow
          label={t('shortcuts.label')}
          hint={t('shortcuts.hint')}
          checked={settings.shortcuts}
          onCheckedChange={(shortcuts) => settings.update({ shortcuts })}
        />
      </Section>

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={restoreDefaults}>
          <RotateCcw aria-hidden data-icon="inline-start" />
          {t('reset')}
        </Button>
      </div>
    </div>
  )
}
