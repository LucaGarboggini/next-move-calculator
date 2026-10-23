import type { AnalysisMessages } from './en'

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export const ptBR: Widen<AnalysisMessages> = {
  panels: {
    analysis: 'Análise',
    settings: 'Configurações da busca',
  },
  actions: {
    calculate: 'Calcular',
    stop: 'Parar',
  },
  toMove: {
    white: 'Vez das brancas',
    black: 'Vez das pretas',
  },
  blocked: {
    invalid: 'Corrija a posição para calcular um lance.',
    checkmate: 'Xeque-mate: não há lance para calcular.',
    stalemate: 'Afogamento: não há lance para calcular.',
  },
  status: {
    idle: 'Toque em Calcular para encontrar o melhor lance.',
    loading: 'Iniciando o motor…',
    searching: 'Calculando…',
    completed: 'Concluído.',
    stopped: 'Interrompido.',
    backgrounded: 'Pausado porque a aba ficou em segundo plano. Toque em Calcular para reiniciar.',
    error: 'O motor falhou: {{message}}',
  },
  eval: {
    bar: 'Quem está ganhando',
    summary: 'Avaliação {{value}}: {{advantage}}',
    whiteAhead: 'As brancas estão melhor',
    blackAhead: 'As pretas estão melhor',
    equal: 'Igual',
    whiteWon: 'As brancas venceram',
    blackWon: 'As pretas venceram',
    none: 'Ainda sem avaliação',
  },
  best: {
    label: 'Melhor lance',
    play: 'Jogar {{move}}',
  },
  stats: {
    label: 'Estatísticas da busca',
    depth: 'Profundidade',
    speed: 'Velocidade',
    speedUnit: '{{value}} n/s',
    nodes: 'Nós',
    time: 'Tempo',
  },
  lines: {
    label: 'Linhas do motor',
    line: 'Linha {{index}}',
    depth: 'profundidade {{depth}}',
    play: 'Jogar {{line}}',
    empty: 'Ainda sem linhas.',
  },
  settings: {
    time: {
      label: 'Tempo por busca',
      value: '{{seconds}} s',
      infinite: 'Até parar',
    },
    depth: {
      label: 'Limite de profundidade',
      placeholder: 'Sem limite',
      hint: 'A busca termina no limite de tempo ou de profundidade, o que vier primeiro.',
    },
    autoMove: {
      label: 'Jogar o melhor lance automaticamente',
      hint: 'Quando o cálculo atinge o limite de tempo ou de profundidade. Parar nunca joga um lance.',
      needsLimit:
        'Precisa de um limite de tempo ou de profundidade: com “Até parar” e sem limite de profundidade, o cálculo só termina quando você toca em Parar, e Parar nunca joga um lance.',
    },
    multiPv: {
      label: 'Linhas',
      option: '{{count}} linhas',
    },
    threads: {
      label: 'Threads',
      hint: 'Recomendado para este dispositivo: {{count}}.',
    },
    hash: {
      label: 'Memória hash',
      option: '{{mb}} MB',
    },
    singleThreaded: 'Este navegador executa o motor em uma única thread.',
    reset: 'Restaurar padrões',
    appliesNext:
      'O lance automático vale na hora; as outras alterações valem a partir do próximo cálculo.',
  },
  shortcuts: {
    group: 'Análise',
    toggle: 'Calcular ou parar o cálculo',
  },
}
