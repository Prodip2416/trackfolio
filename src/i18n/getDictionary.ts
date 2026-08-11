import { cookies } from 'next/headers'

// Use dynamic imports to load the JSON files asynchronously
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  bn: () => import('./dictionaries/bn.json').then((module) => module.default),
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
