import { cookies } from 'next/headers'

import en from './dictionaries/en.json'
import bn from './dictionaries/bn.json'

const dictionaries = {
  en: () => Promise.resolve(en),
  bn: () => Promise.resolve(bn),
}

export type Locale = keyof typeof dictionaries

// Whitelist check: a cookie like "constructor" must not hit Object.prototype
const isLocale = (v: string | undefined): v is Locale =>
  !!v && Object.hasOwn(dictionaries, v)

export const getLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies()
  const value = cookieStore.get('NEXT_LOCALE')?.value
  return isLocale(value) ? value : 'en'
}

export const getDictionary = async () => {
  return dictionaries[await getLocale()]()
}

