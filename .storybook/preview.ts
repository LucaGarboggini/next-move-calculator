import type { Decorator, Preview } from '@storybook/react-vite'
import '../src/index.css'

const withTheme: Decorator = (Story, context) => {
  document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
  return Story()
}

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: { a11y: { test: 'error' } },
}

export default preview
