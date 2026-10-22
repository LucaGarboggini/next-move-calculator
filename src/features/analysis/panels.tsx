import { useTranslation } from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui'
import { ANALYSIS_NAMESPACE } from './i18n'
import { SearchSettings } from './SearchSettings'

export { AnalysisPanel } from './AnalysisPanel'

/** Search limits, number of lines, threads and hash memory. */
export function SearchSettingsPanel() {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.settings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <SearchSettings />
      </CardContent>
    </Card>
  )
}
