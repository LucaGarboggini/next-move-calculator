export const en = {
  label: 'Chessboard',
  hint: 'Use the arrow keys to move around the board, Enter or Space to select a square or move, Escape to cancel. In the editor, Delete removes a piece.',
  pieces: {
    white: {
      pawn: 'white pawn',
      knight: 'white knight',
      bishop: 'white bishop',
      rook: 'white rook',
      queen: 'white queen',
      king: 'white king',
    },
    black: {
      pawn: 'black pawn',
      knight: 'black knight',
      bishop: 'black bishop',
      rook: 'black rook',
      queen: 'black queen',
      king: 'black king',
    },
  },
  squareEmpty: '{{square}}, empty',
  squareOccupied: '{{square}}, {{piece}}',
  selected_one: '{{square}} selected, {{count}} move available',
  selected_other: '{{square}} selected, {{count}} moves available',
  deselected: 'Selection cleared',
  moved: '{{piece}} from {{from}} to {{to}}',
  placed: '{{piece}} placed on {{square}}',
  removed: 'Piece removed from {{square}}',
  promotion: {
    title: 'Promote the pawn to',
    cancel: 'Cancel',
  },
}

export type BoardBundle = typeof en
