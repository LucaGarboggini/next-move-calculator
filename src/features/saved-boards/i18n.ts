import { registerTranslations } from '@/i18n'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export const SAVED_BOARDS_NAMESPACE = 'savedBoards'

registerTranslations(SAVED_BOARDS_NAMESPACE, { en, 'pt-BR': ptBR })
