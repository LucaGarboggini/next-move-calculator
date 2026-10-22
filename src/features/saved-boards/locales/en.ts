export const en = {
  title: 'Saved boards',
  name: {
    label: 'Name',
    placeholder: 'For example: Rook ending',
  },
  save: 'Save this board',
  saved: 'Saved “{{name}}”.',
  full: 'You have reached the limit of {{max}} saved boards. Delete one to save another.',
  empty: 'Nothing saved yet. Save the board to come back to it later.',
  list: 'Your saved boards',
  savedOn: 'Saved {{date}}',
  withMoves: 'With moves',
  load: 'Load “{{name}}”',
  loaded: 'Loaded “{{name}}”.',
  loadFailed: 'This board could not be loaded.',
  rename: 'Rename “{{name}}”',
  renameField: 'New name',
  renameSave: 'Save name',
  cancel: 'Cancel',
  delete: 'Delete “{{name}}”',
  deleteTitle: 'Delete this board?',
  deleteDescription: '“{{name}}” will be removed from this browser.',
  deleteConfirm: 'Delete',
  close: 'Close',
} as const

export type SavedBoardsMessages = typeof en
