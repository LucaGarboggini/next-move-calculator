/** Default locale. Every other locale must provide exactly these keys (see i18n.test.ts). */
export const en = {
  app: {
    title: 'Next-Move Calculator',
    skipToContent: 'Skip to board',
  },
  panels: {
    welcome: {
      title: 'Welcome',
      description:
        'Set up any position and get the best moves, evaluation and lines, computed in your browser. Analysis arrives in an upcoming release.',
    },
  },
  settings: {
    theme: {
      label: 'Theme',
      system: 'System theme',
      light: 'Light theme',
      dark: 'Dark theme',
    },
    language: {
      label: 'Language',
      system: 'System language',
    },
  },
} as const

export type Messages = typeof en
