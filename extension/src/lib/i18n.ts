import zh, { type TranslationKey } from '@/locales/zh'
import en from '@/locales/en'

export type TFunction = (key: TranslationKey, params?: Record<string, string>) => string

const messages: Record<string, Record<string, string>> = { zh, en }

function getLocale(): 'zh' | 'en' {
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('zh') ? 'zh' : 'en'
}

export function useLocale() {
  const locale = getLocale()
  const dict = messages[locale] || messages['en']

  function t(key: TranslationKey, params?: Record<string, string>): string {
    let text = dict[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v)
      }
    }
    return text
  }

  return { locale, t }
}
