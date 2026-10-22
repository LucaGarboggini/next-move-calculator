import { Card, CardDescription, CardHeader, CardTitle } from '@/ui'
import { useTranslation } from '@/i18n'

/** Placeholder until the editor and analysis features register their own panels. */
export function WelcomePanel() {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.welcome.title')}</CardTitle>
        <CardDescription>{t('panels.welcome.description')}</CardDescription>
      </CardHeader>
    </Card>
  )
}
