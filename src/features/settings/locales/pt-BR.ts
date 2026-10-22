import type { SettingsMessages } from './en'

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export const ptBR: Widen<SettingsMessages> = {
  open: 'Configurações',
  close: 'Fechar',
  title: 'Configurações',
  description: 'Suas escolhas ficam salvas neste navegador.',
  sections: {
    appearance: 'Aparência',
    board: 'Tabuleiro e lances',
    engine: 'Motor',
    keyboard: 'Teclado',
  },
  boardTheme: {
    label: 'Cores do tabuleiro',
    green: 'Verde',
    brown: 'Marrom',
    blue: 'Azul',
  },
  pieceTheme: {
    label: 'Peças',
    classic: 'Clássicas',
    glyph: 'Símbolos de texto',
  },
  notation: {
    label: 'Notação dos lances',
    san: 'Padrão (Cf3)',
    figurine: 'Figurinas (♘f3)',
    uci: 'Coordenadas (g1f3)',
  },
  autoQueen: {
    label: 'Sempre promover a dama',
    hint: 'Pula a escolha da peça quando um peão chega à última fileira.',
  },
  engine: {
    label: 'Tamanho do motor',
    lite: 'Leve',
    liteHint: 'Cerca de {{size}} MB. Carrega rápido e serve para qualquer dispositivo.',
    full: 'Completo',
    fullHint: 'Cerca de {{size}} MB. O mais forte. Baixado uma vez e guardado neste navegador.',
    appliesNext: 'A mudança vale a partir do próximo cálculo.',
  },
  fullWarning: {
    title: 'Usar o motor Completo?',
    description: 'Ele baixa cerca de {{size}} MB na primeira vez e usa mais memória.',
    mobile:
      'Isto parece um celular ou tablet, onde um download grande e mais memória podem deixar o aparelho lento.',
    lowMemory: 'Este dispositivo informa pouca memória.',
    singleThreaded:
      'Este navegador não consegue usar várias threads aqui, então o motor Completo será mais lento do que poderia.',
    confirm: 'Usar Completo',
    cancel: 'Manter Leve',
  },
  shortcuts: {
    label: 'Atalhos de teclado',
    hint: 'Desative se os atalhos de uma tecla atrapalharem.',
    group: 'Geral',
    help: 'Mostrar os atalhos de teclado',
    show: 'Ver atalhos',
    title: 'Atalhos de teclado',
    description:
      'Os atalhos não funcionam enquanto você digita em um campo ou há uma janela aberta.',
    empty: 'Não há atalhos para mostrar.',
    off: 'Os atalhos de teclado estão desativados nas configurações.',
  },
  reset: 'Restaurar padrões',
}
