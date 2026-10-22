import { Keyboard, Settings } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { Button, useShortcuts } from '@/ui'
import { SETTINGS_NAMESPACE } from './i18n'
import { SettingsDialog } from './SettingsDialog'
import { ShortcutsDialog } from './ShortcutsDialog'

/** Header buttons that open the settings and the shortcut list; `?` opens the list too. */
export function SettingsControls() {
  const { t } = useTranslation(SETTINGS_NAMESPACE)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useShortcuts([
    {
      id: 'help',
      keys: '?',
      label: t('shortcuts.help'),
      group: t('shortcuts.group'),
      run: () => setShortcutsOpen(true),
    },
  ])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('shortcuts.show')}
        title={t('shortcuts.show')}
        onClick={() => setShortcutsOpen(true)}
      >
        <Keyboard aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('open')}
        title={t('open')}
        onClick={() => setSettingsOpen(true)}
      >
        <Settings aria-hidden />
      </Button>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  )
}
