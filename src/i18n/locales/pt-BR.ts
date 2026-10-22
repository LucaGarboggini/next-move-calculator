import type { Messages } from './en'

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export const ptBR: Widen<Messages> = {
  app: {
    title: 'Calculadora do Próximo Lance',
    skipToContent: 'Ir para o tabuleiro',
  },
  panels: {
    welcome: {
      title: 'Boas-vindas',
      description:
        'Monte qualquer posição e receba os melhores lances, a avaliação e as variantes, calculados no seu navegador. Os painéis de edição e análise chegam nas próximas versões.',
    },
  },
  settings: {
    theme: {
      label: 'Tema',
      system: 'Tema do sistema',
      light: 'Tema claro',
      dark: 'Tema escuro',
    },
    language: {
      label: 'Idioma',
      system: 'Idioma do sistema',
    },
  },
}
