import { registerTranslations } from '@/i18n'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export const SETTINGS_NAMESPACE = 'settings'

registerTranslations(SETTINGS_NAMESPACE, { en, 'pt-BR': ptBR })
