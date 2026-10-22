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
    label: 'Avaliação, do ponto de vista das brancas',
    value: 'Avaliação {{value}}',
    whiteAhead: 'As brancas estão melhor',
    blackAhead: 'As pretas estão melhor',
    equal: 'Igual',
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
    appliesNext: 'As alterações valem a partir do próximo cálculo.',
  },
  shortcuts: {
    group: 'Análise',
    toggle: 'Calcular ou parar o cálculo',
  },
}
