import { registerTranslations } from '@/i18n'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export const ANALYSIS_NAMESPACE = 'analysis'

registerTranslations(ANALYSIS_NAMESPACE, { en, 'pt-BR': ptBR })
