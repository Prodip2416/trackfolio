import { z } from 'zod'
import { isRealIsoDate, todayInDhaka } from '@/lib/date'

/** Strict YYYY-MM-DD string that is a real calendar date and not in the future (BD time). */
export const pastOrTodayDateString = z
  .string({ error: 'Please select a valid date' })
  .refine(isRealIsoDate, 'Please select a valid date')
  .refine(s => s <= todayInDhaka(), 'Date cannot be in the future')
