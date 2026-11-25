import Link from 'next/link'
import { AlertTriangle, CalendarRange, Coins, Gauge, Info, PiggyBank, Tag, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { AllTimeSummary, MissingPrice, YearReturn } from '@/lib/returns'
import { STALE_DAY } from '@/lib/returns'
import ReturnsChart from './ReturnsChart'
import { card, fmt, makeFormat, toneOf, type ReturnsDict } from './format'

type View =
  | { kind: 'empty' }
  | { kind: 'all'; summary: AllTimeSummary }
  | { kind: 'year'; result: YearReturn }

type Props = { t: ReturnsDict; years: number[]; selected: number | 'all'; today: string; view: View }

const BASE = '/analytics/returns'
const PRICES = '/analytics/returns/prices'

export default function ReturnsClient({ t, years, selected, today, view }: Props) {
  const f = makeFormat(t.locale)
  const currentYear = Number(today.slice(0, 4))
  const yearLabel = (y: number) => (y === currentYear ? fmt(t.ytd, { year: f.year(y) }) : f.year(y))

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="returns-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
        </div>
        <Link
          href={PRICES}
          data-testid="returns-prices-link"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Tag className="w-4 h-4" /> {t.pricesLink}
        </Link>
      </div>

      {years.length > 0 && (
        <nav className="flex flex-wrap gap-2" aria-label={t.title} data-testid="returns-years">
          <YearPill href={BASE} active={selected === 'all'} testId="returns-year-all">{t.allTime}</YearPill>
          {years.map(y => (
            <YearPill key={y} href={`${BASE}?year=${y}`} active={selected === y} testId={`returns-year-${y}`}>
              {yearLabel(y)}
            </YearPill>
          ))}
        </nav>
      )}

      {view.kind === 'empty' && (
        <div className={`${card} p-10 text-center text-gray-500 dark:text-gray-400`} data-testid="returns-empty">{t.empty}</div>
      )}
      {view.kind === 'year' && <YearView t={t} f={f} r={view.result} label={yearLabel(view.result.year)} />}
      {view.kind === 'all' && <AllTimeView t={t} f={f} s={view.summary} yearLabel={yearLabel} />}
    </div>
  )
}

type F = ReturnType<typeof makeFormat>

/** Start/end value text; '—' when a price for that side is missing (a partial sum would mislead). */
const sideValues = (f: F, r: YearReturn) => ({
  start: r.missing.some(m => m.year === r.year - 1) ? '—' : f.taka(r.startValue),
  end: r.missing.some(m => m.year === r.year) ? '—' : f.taka(r.endValue)
})

function YearPill({ href, active, testId, children }: { href: string; active: boolean; testId: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      data-testid={testId}
      aria-current={active ? 'page' : undefined}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {children}
    </Link>
  )
}

function Stat({
  label, value, hint, tone, icon: Icon, testId
}: {
  label: string; value: string; hint?: string; tone?: string; icon: React.ComponentType<{ className?: string }>; testId?: string
}) {
  return (
    <div className={`${card} p-4`} data-testid={testId}>
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className={`mt-2 text-xl font-bold tabular-nums ${tone ?? 'text-gray-900 dark:text-white'}`} data-testid={testId ? `${testId}-value` : undefined}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
}

function Notice({ tone, children, testId }: { tone: 'amber' | 'gray'; children: React.ReactNode; testId?: string }) {
  const cls =
    tone === 'amber'
      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${cls}`} data-testid={testId}>
      {tone === 'amber' ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 mt-0.5 shrink-0" />}
      <div className="flex-1">{children}</div>
    </div>
  )
}

function MissingNotice({ t, missing }: { t: ReturnsDict; missing: MissingPrice[] }) {
  const unique = new Map(missing.map(m => [`${m.symbol}|${m.year}`, m]))
  const firstYear = Math.min(...[...unique.values()].map(m => m.year))
  return (
    <Notice tone="amber" testId="returns-missing">
      {fmt(t.warnings.missing, { count: unique.size })}{' '}
      <Link href={`${PRICES}?year=${firstYear}`} className="font-semibold underline" data-testid="returns-missing-link">
        {t.warnings.addPrices} →
      </Link>
    </Notice>
  )
}

function YearView({ t, f, r, label }: { t: ReturnsDict; f: F; r: YearReturn; label: string }) {
  const returnText =
    r.returnPct !== null ? f.pct(r.returnPct) : r.status === 'missing' ? t.status.missing : r.status === 'invalid' ? t.status.invalid : '—'

  return (
    <div className="space-y-4">
      {r.missing.length > 0 && <MissingNotice t={t} missing={r.missing} />}
      {r.stale.length > 0 && (
        <Notice tone="amber" testId="returns-stale">{fmt(t.warnings.stale, { count: r.stale.length, day: STALE_DAY })}</Notice>
      )}
      {r.status === 'invalid' && <Notice tone="gray">{t.hints.invalid}</Notice>}
      {r.status === 'noActivity' && <Notice tone="gray">{t.hints.noActivity}</Notice>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          testId="returns-year-return"
          icon={r.returnPct !== null && r.returnPct < 0 ? TrendingDown : TrendingUp}
          label={`${t.cards.returnPct} · ${label}`}
          value={returnText}
          tone={toneOf(r.returnPct)}
          hint={fmt(t.hints.period, { start: f.date(r.periodStart), end: f.date(r.periodEnd) })}
        />
        <Stat icon={CalendarRange} label={t.cards.startEnd} value={`${sideValues(f, r).start} → ${sideValues(f, r).end}`} testId="returns-start-end" />
        <Stat icon={Wallet} label={t.cards.netInvested} value={f.signedTaka(r.netFlow)} hint={t.hints.netInvested} />
        <Stat icon={PiggyBank} label={t.cards.totalGain} value={r.status === 'missing' ? '—' : f.signedTaka(r.gain)} tone={r.status === 'missing' ? undefined : toneOf(r.gain)} testId="returns-gain" />
        <Stat icon={Coins} label={t.cards.realized} value={f.signedTaka(r.realized)} tone={toneOf(r.realized)} testId="returns-realized" />
        <Stat icon={Gauge} label={t.cards.unrealized} value={r.status === 'missing' ? '—' : f.signedTaka(r.unrealized)} tone={r.status === 'missing' ? undefined : toneOf(r.unrealized)} />
        <Stat icon={Coins} label={t.cards.dividend} value={f.taka(r.dividends)} testId="returns-dividend" />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t.hints.method}</p>

      {r.stocks.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">{t.table.stocksTitle}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" data-testid="returns-stock-table">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-2 text-left font-medium">{t.table.symbol}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.startQty}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.startValue}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.buy}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.sell}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.endQty}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.endValue}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.dividend}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.realized}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.table.gain}</th>
                </tr>
              </thead>
              <tbody>
                {r.stocks.map(s => (
                  <tr key={s.symbol} data-testid={`returns-stock-${s.symbol}`} className="border-b last:border-0 border-gray-50 dark:border-gray-800/60 tabular-nums text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{s.symbol}</td>
                    <td className="px-3 py-2.5 text-right">{f.num(s.startQty)}</td>
                    <td className="px-3 py-2.5 text-right">{s.startQty > 0 && s.startPrice === null ? '—' : f.taka(s.startValue)}</td>
                    <td className="px-3 py-2.5 text-right">{f.taka(s.buyAmount)}</td>
                    <td className="px-3 py-2.5 text-right">{f.taka(s.sellAmount)}</td>
                    <td className="px-3 py-2.5 text-right">{f.num(s.endQty)}</td>
                    <td className="px-3 py-2.5 text-right">{s.endQty > 0 && s.endPrice === null ? '—' : f.taka(s.endValue)}</td>
                    <td className="px-3 py-2.5 text-right">{f.taka(s.dividend)}</td>
                    <td className={`px-3 py-2.5 text-right ${toneOf(s.realized)}`}>{f.signedTaka(s.realized)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${toneOf(s.gain)}`}>{s.gain === null ? '—' : f.signedTaka(s.gain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AllTimeView({ t, f, s, yearLabel }: { t: ReturnsDict; f: F; s: AllTimeSummary; yearLabel: (y: number) => string }) {
  const missing = s.years.flatMap(y => y.missing)
  const cagrText = s.cagr !== null ? f.pct(s.cagr) : '—'
  const cagrHint =
    s.cagrStatus === 'ok' && s.firstDate ? fmt(t.hints.cagr, { date: f.date(s.firstDate) })
      : s.cagrStatus === 'short' ? t.hints.cagrShort
        : s.cagrStatus === 'missing' ? t.hints.cagrMissing
          : undefined
  const yearReturnText = (y: YearReturn) =>
    y.returnPct !== null ? f.pct(y.returnPct) : y.status === 'missing' ? t.status.missing : t.status.invalid

  return (
    <div className="space-y-4">
      {missing.length > 0 && <MissingNotice t={t} missing={missing} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat testId="returns-cagr" icon={Gauge} label={t.cards.cagr} value={cagrText} tone={toneOf(s.cagr)} hint={cagrHint} />
        <Stat testId="returns-cumulative" icon={TrendingUp} label={t.cards.cumulative} value={s.cumulativeReturn !== null ? f.pct(s.cumulativeReturn) : '—'} tone={toneOf(s.cumulativeReturn)} />
        <Stat icon={CalendarRange} label={t.cards.span} value={f.num(Math.round(s.span * 10) / 10)} />
        <Stat testId="returns-total-gain" icon={PiggyBank} label={t.cards.totalGain} value={s.totalGain !== null ? f.signedTaka(s.totalGain) : '—'} tone={toneOf(s.totalGain)} />
        <Stat icon={TrendingUp} label={t.cards.best} value={s.best ? `${yearLabel(s.best.year)} · ${f.pct(s.best.returnPct)}` : '—'} tone={toneOf(s.best?.returnPct)} />
        <Stat icon={TrendingDown} label={t.cards.worst} value={s.worst ? `${yearLabel(s.worst.year)} · ${f.pct(s.worst.returnPct)}` : '—'} tone={toneOf(s.worst?.returnPct)} />
        <Stat icon={Coins} label={t.cards.realized} value={f.signedTaka(s.totalRealized)} tone={toneOf(s.totalRealized)} />
        <Stat icon={Coins} label={t.cards.dividend} value={f.taka(s.totalDividends)} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t.hints.method}</p>

      {s.years.length > 0 && (
        <div className={`${card} p-4 sm:p-6`}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.chart.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.chart.subtitle}</p>
          {s.years.some(y => y.returnPct !== null) ? (
            <ReturnsChart
              data={s.years.map(y => ({
                label: yearLabel(y.year),
                value: y.returnPct !== null ? Math.round(y.returnPct * 10000) / 100 : null,
                text: yearReturnText(y)
              }))}
            />
          ) : (
            <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400" data-testid="returns-chart-empty">{t.chart.empty}</p>
          )}
        </div>
      )}

      {s.years.length > 0 && (
        <div className={`${card} overflow-hidden`}>
          <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">{t.table.yearsTitle}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" data-testid="returns-years-table">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-2 text-left font-medium">{t.table.year}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.start}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.end}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.netFlow}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.dividend}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.gain}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.table.returnPct}</th>
                </tr>
              </thead>
              <tbody>
                {s.years.slice().reverse().map(y => (
                  <tr key={y.year} data-testid={`returns-row-${y.year}`} className="border-b last:border-0 border-gray-50 dark:border-gray-800/60 tabular-nums text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-2.5 font-semibold">
                      <Link href={`${BASE}?year=${y.year}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{yearLabel(y.year)}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-right">{sideValues(f, y).start}</td>
                    <td className="px-3 py-2.5 text-right">{sideValues(f, y).end}</td>
                    <td className="px-3 py-2.5 text-right">{f.signedTaka(y.netFlow)}</td>
                    <td className="px-3 py-2.5 text-right">{f.taka(y.dividends)}</td>
                    <td className={`px-3 py-2.5 text-right ${y.status === 'missing' ? '' : toneOf(y.gain)}`}>{y.status === 'missing' ? '—' : f.signedTaka(y.gain)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${toneOf(y.returnPct)}`}>{yearReturnText(y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
