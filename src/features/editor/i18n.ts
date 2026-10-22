import { registerTranslations } from '@/i18n'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export const EDITOR_NAMESPACE = 'editor'

registerTranslations(EDITOR_NAMESPACE, { en, 'pt-BR': ptBR })
