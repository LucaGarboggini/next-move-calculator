import { useTranslation } from '@/i18n'
import { useShortcuts } from '@/ui'
import { useAnalysis } from './hooks'
import { ANALYSIS_NAMESPACE } from './i18n'

/** Registers the analysis keyboard shortcuts; renders nothing. */
export function AnalysisShortcuts() {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const { running, blocker, calculate, stop } = useAnalysis()
  useShortcuts([
    {
      id: 'toggle',
      keys: 'mod+enter',
      label: t('shortcuts.toggle'),
      group: t('shortcuts.group'),
      run: () => {
        if (running) stop()
        else if (!blocker) calculate()
      },
    },
  ])
  return null
}
