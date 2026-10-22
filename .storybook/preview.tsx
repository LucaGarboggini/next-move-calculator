import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/index.css'
import { LOCALES, LOCALE_NAMES, setLocale, type Locale } from '../src/i18n'
import { TooltipProvider } from '../src/ui'

/** Every story renders in the toolbar-selected theme and locale, like the real app. */
const withGlobals: Decorator = (Story, context) => {
  document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
  void setLocale(context.globals.locale as Locale)
  return (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  )
}

const preview: Preview = {
  decorators: [withGlobals],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
    locale: {
      description: 'Locale',
      toolbar: {
        icon: 'globe',
        items: LOCALES.map((value) => ({ value, title: LOCALE_NAMES[value] })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', locale: 'en' },
  parameters: { a11y: { test: 'error' }, layout: 'centered' },
}

export default preview
