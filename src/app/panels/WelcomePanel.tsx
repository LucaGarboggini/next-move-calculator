import { Card, CardDescription, CardHeader, CardTitle } from '@/ui'
import { useTranslation } from '@/i18n'

/** Example panel for the shell stories; the app registers the editor's panels instead. */
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
