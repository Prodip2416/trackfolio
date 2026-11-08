const pad = (n: number) => String(n).padStart(2, '0')

/** Today's date as YYYY-MM-DD in the browser's local timezone (not UTC). */
export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today's date as YYYY-MM-DD in Bangladesh time — servers (Vercel) run in UTC. */
export function todayInDhaka(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
}

/** True if s is a real calendar date in YYYY-MM-DD form. */
export function isRealIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
