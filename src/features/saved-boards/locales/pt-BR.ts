import type { SavedBoardsMessages } from './en'

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }

export const ptBR: Widen<SavedBoardsMessages> = {
  title: 'Tabuleiros salvos',
  name: {
    label: 'Nome',
    placeholder: 'Por exemplo: Final de torres',
  },
  save: 'Salvar este tabuleiro',
  saved: '“{{name}}” foi salvo.',
  full: 'Você chegou ao limite de {{max}} tabuleiros salvos. Exclua um para salvar outro.',
  empty: 'Nada salvo ainda. Salve o tabuleiro para voltar a ele depois.',
  list: 'Seus tabuleiros salvos',
  savedOn: 'Salvo em {{date}}',
  withMoves: 'Com lances',
  load: 'Carregar “{{name}}”',
  loaded: '“{{name}}” foi carregado.',
  loadFailed: 'Não foi possível carregar este tabuleiro.',
  rename: 'Renomear “{{name}}”',
  renameField: 'Novo nome',
  renameSave: 'Salvar nome',
  cancel: 'Cancelar',
  delete: 'Excluir “{{name}}”',
  deleteTitle: 'Excluir este tabuleiro?',
  deleteDescription: '“{{name}}” será removido deste navegador.',
  deleteConfirm: 'Excluir',
  close: 'Fechar',
}
