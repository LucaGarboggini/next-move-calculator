import type { BoardBundle } from './en'

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export const ptBR: Widen<BoardBundle> = {
  label: 'Tabuleiro de xadrez',
  hint: 'Use as setas para percorrer o tabuleiro, Enter ou Espaço para selecionar uma casa ou mover, Esc para cancelar. No editor, Delete remove uma peça.',
  pieces: {
    white: {
      pawn: 'peão branco',
      knight: 'cavalo branco',
      bishop: 'bispo branco',
      rook: 'torre branca',
      queen: 'dama branca',
      king: 'rei branco',
    },
    black: {
      pawn: 'peão preto',
      knight: 'cavalo preto',
      bishop: 'bispo preto',
      rook: 'torre preta',
      queen: 'dama preta',
      king: 'rei preto',
    },
  },
  squareEmpty: '{{square}}, vazia',
  squareOccupied: '{{square}}, {{piece}}',
  selected_one: '{{square}} selecionada, {{count}} lance disponível',
  selected_other: '{{square}} selecionada, {{count}} lances disponíveis',
  deselected: 'Seleção removida',
  moved: '{{piece}} de {{from}} para {{to}}',
  placed: '{{piece}} colocado em {{square}}',
  removed: 'Peça removida de {{square}}',
  promotion: {
    title: 'Promover o peão para',
    cancel: 'Cancelar',
  },
}
