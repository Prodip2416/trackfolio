import { describe, it, expect } from 'vitest'
import en from '@/i18n/dictionaries/en.json'
import bn from '@/i18n/dictionaries/bn.json'

const keys = (o: unknown, prefix = ''): string[] =>
  o && typeof o === 'object'
    ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)]

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()

describe('Yearly Return dictionaries', () => {
  it('en and bn have the same keys', () => {
    expect(keys(bn.returns).sort()).toEqual(keys(en.returns).sort())
    expect(bn.sidebar.yearlyReturn).toBeTruthy()
    expect(bn.sidebar.yearEndPrices).toBeTruthy()
  })

  it('en and bn use the same {placeholders}', () => {
    const get = (o: unknown, path: string) => path.split('.').reduce((a: any, k) => a?.[k], o) as string
    for (const k of keys(en.returns)) {
      expect(placeholders(get(bn.returns, k)), k).toEqual(placeholders(get(en.returns, k)))
    }
  })
})
