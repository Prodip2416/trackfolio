import { cookies } from 'next/headers'

import en from './dictionaries/en.json'
import bn from './dictionaries/bn.json'

const dictionaries = {
  en: () => Promise.resolve(en),
  bn: () => Promise.resolve(bn),
}

export type Locale = keyof typeof dictionaries

export const getDictionary = async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Locale
  
  if (!dictionaries[locale]) {
    return dictionaries.en()
  }
  
  return dictionaries[locale]()
}

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies()
  return (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Locale
}

