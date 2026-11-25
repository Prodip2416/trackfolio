import { describe, expect, it } from 'vitest'
import en from '@/i18n/dictionaries/en.json'
import bn from '@/i18n/dictionaries/bn.json'
import { fmt, fmtTaka, warningText } from './i18n'

type Tree = { [k: string]: string | Tree }
function flatten(o: Tree, prefix = ''): Record<string, string> {
  return Object.entries(o).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return typeof v === 'string' ? { ...acc, [key]: v } : { ...acc, ...flatten(v, key) }
  }, {})
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()

describe('prize bond i18n', () => {
  const e = flatten(en.prizeBond as Tree)
  const b = flatten(bn.prizeBond as Tree)

  it('bn and en have exactly the same keys', () => {
    expect(Object.keys(b).sort()).toEqual(Object.keys(e).sort())
  })
  it('every string uses the same placeholders in both languages', () => {
    for (const k of Object.keys(e)) expect(placeholders(b[k]), k).toEqual(placeholders(e[k]))
  })
  it('sidebar keys exist in both', () => {
    for (const k of ['prizeBond', 'myBonds', 'drawResults', 'winnings'] as const) {
      expect(en.sidebar[k]).toBeTruthy()
      expect(bn.sidebar[k]).toBeTruthy()
    }
  })
  it('fmt interpolates and keeps unknown placeholders', () => {
    expect(fmt('{a} of {b} {c}', { a: 1, b: 'x' })).toBe('1 of x {c}')
  })
  it('warningText localises the rank', () => {
    expect(warningText(bn.prizeBond, { code: 'COUNT_MISMATCH', rank: 5, expected: 40, found: 39 })).toBe(
      '৫ম পুরস্কার: 40টি নম্বর থাকার কথা, পাওয়া গেছে 39টি।'
    )
  })
  it('fmtTaka uses Indian grouping', () => expect(fmtTaka(600000)).toBe('৳6,00,000'))
})
