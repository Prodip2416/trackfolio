import Link from 'next/link'
import {
  Activity, AlertTriangle, ArrowDownRight, CalendarRange, Coins, Gauge, HandCoins, Info, PiggyBank, Tag, TrendingDown, TrendingUp, Trophy, Wallet
} from 'lucide-react'
import type { AllTimeSummary, MissingPrice, YearReturn } from '@/lib/returns'
import { STALE_DAY, topMovers } from '@/lib/returns'
import ReturnsChart from './ReturnsChart'
import YearSelect, { type YearOption } from './YearSelect'
import { card, fmt, makeFormat, toneOf, type ReturnsDict } from './format'

type View =
  | { kind: 'empty' }
  | { kind: 'all'; summary: AllTimeSummary }
  | { kind: 'year'; result: YearReturn }

type Props = {
  t: ReturnsDict
  /** first and last year offered in the filter; years after the running year are disabled */
  range: { from: number; to: number }
  selected: number | 'all'
  today: string
  view: View
}

const BASE = '/analytics/returns'
const PRICES = '/analytics/returns/prices'

export default function ReturnsClient({ t, range, selected, today, view }: Props) {
  const f = makeFormat(t.locale)
  const currentYear = Number(today.slice(0, 4))
  const yearLabel = (y: number) => (y === currentYear ? fmt(t.ytd, { year: f.year(y) }) : f.year(y))

  const options: YearOption[] = [{ value: 'all', label: t.allTime }]
  for (let y = range.from; y <= range.to; y++) {
    // keywords: typing "2026" also finds a Bangla-digit label (২০২৬)
    options.push({ value: String(y), label: yearLabel(y), disabled: y > currentYear, keywords: String(y) })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4" data-testid="returns-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{t.title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
        </div>
        {view.kind !== 'empty' && (
          <YearSelect
            options={options}
            value={String(selected)}
            basePath={BASE}
            searchPlaceholder={t.searchYear}
            noResultsText={t.noYearFound}
          />
        )}
      </div>

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

/** Method note + a small link to Year-end Prices (only needed to fix a missing/stale price). */
function Footnote({ t }: { t: ReturnsDict }) {
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {t.hints.method}{' '}
      <Link href={PRICES} data-testid="returns-prices-link" className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap">
        <Tag className="w-3 h-3" /> {t.pricesLink}
      </Link>
    </p>
  )
}

type Accent = 'indigo' | 'sky' | 'violet' | 'amber' | 'emerald' | 'rose' | 'teal' | 'orange' | 'fuchsia'

// Full class strings (Tailwind can't see dynamically built names)
const ACCENTS: Record<Accent, { chip: string; glow: string; bar: string }> = {
  indigo: { chip: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300', glow: 'from-indigo-50/80 dark:from-indigo-500/10', bar: 'bg-indigo-500' },
  sky: { chip: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300', glow: 'from-sky-50/80 dark:from-sky-500/10', bar: 'bg-sky-500' },
  violet: { chip: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300', glow: 'from-violet-50/80 dark:from-violet-500/10', bar: 'bg-violet-500' },
  amber: { chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', glow: 'from-amber-50/80 dark:from-amber-500/10', bar: 'bg-amber-500' },
  emerald: { chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', glow: 'from-emerald-50/80 dark:from-emerald-500/10', bar: 'bg-emerald-500' },
  rose: { chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300', glow: 'from-rose-50/80 dark:from-rose-500/10', bar: 'bg-rose-500' },
  teal: { chip: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300', glow: 'from-teal-50/80 dark:from-teal-500/10', bar: 'bg-teal-500' },
  orange: { chip: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300', glow: 'from-orange-50/80 dark:from-orange-500/10', bar: 'bg-orange-500' },
  fuchsia: { chip: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300', glow: 'from-fuchsia-50/80 dark:from-fuchsia-500/10', bar: 'bg-fuchsia-500' }
}

/** Accent that follows the sign: green for a gain, red for a loss, neutral otherwise. */
const signAccent = (n: number | null | undefined, neutral: Accent): Accent =>
  n === null || n === undefined || Math.abs(n) < 1e-9 ? neutral : n > 0 ? 'emerald' : 'rose'

function Stat({
  label, value, hint, hintTone, tone, icon: Icon, accent, testId
}: {
  label: string
  value: string
  hint?: string
  hintTone?: string
  tone?: string
  icon: React.ComponentType<{ className?: string }>
  accent: Accent
  testId?: string
}) {
  const a = ACCENTS[accent]
  return (
    <div className={`${card} relative overflow-hidden flex items-center gap-3 px-3.5 py-3 bg-gradient-to-br ${a.glow} to-transparent`} data-testid={testId}>
      <span className={`absolute inset-y-0 left-0 w-1 ${a.bar}`} aria-hidden />
      <span className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl ${a.chip}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-lg font-bold leading-snug tabular-nums ${tone ?? 'text-gray-900 dark:text-white'}`} data-testid={testId ? `${testId}-value` : undefined}>
            {value}
          </p>
          {hint && (
            <p className={`text-[11px] leading-snug ${hintTone ?? 'text-gray-500 dark:text-gray-400'}`} data-testid={testId ? `${testId}-hint` : undefined}>
              {hint}
            </p>
          )}
        </div>
      </div>
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
    <div className="space-y-3">
      {r.missing.length > 0 && <MissingNotice t={t} missing={r.missing} />}
      {r.stale.length > 0 && (
        <Notice tone="amber" testId="returns-stale">{fmt(t.warnings.stale, { count: r.stale.length, day: STALE_DAY })}</Notice>
      )}
      {r.status === 'invalid' && <Notice tone="gray">{t.hints.invalid}</Notice>}
      {r.status === 'noActivity' && <Notice tone="gray">{t.hints.noActivity}</Notice>}

      {/* 3 × 3: result · money in/out · where it came from */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat
          testId="returns-year-return"
          icon={r.returnPct !== null && r.returnPct < 0 ? TrendingDown : TrendingUp}
          accent={signAccent(r.returnPct, 'indigo')}
          label={`${t.cards.returnPct} · ${label}`}
          value={returnText}
          tone={toneOf(r.returnPct)}
          hint={fmt(t.hints.period, { start: f.date(r.periodStart), end: f.date(r.periodEnd) })}
        />
        <Stat icon={PiggyBank} accent={r.status === 'missing' ? 'indigo' : signAccent(r.gain, 'indigo')} label={t.cards.totalGain} value={r.status === 'missing' ? '—' : f.signedTaka(r.gain)} tone={r.status === 'missing' ? undefined : toneOf(r.gain)} testId="returns-gain" />
        <Stat icon={CalendarRange} accent="sky" label={t.cards.startEnd} value={`${sideValues(f, r).start} → ${sideValues(f, r).end}`} testId="returns-start-end" />
        <Stat icon={Wallet} accent="violet" label={t.cards.netInvested} value={f.signedTaka(r.netFlow)} hint={t.hints.netInvested} />
        <Stat icon={HandCoins} accent="teal" label={t.cards.realized} value={f.signedTaka(r.realized)} tone={toneOf(r.realized)} testId="returns-realized" />
        <Stat icon={Activity} accent="orange" label={t.cards.unrealized} value={r.status === 'missing' ? '—' : f.signedTaka(r.unrealized)} tone={r.status === 'missing' ? undefined : toneOf(r.unrealized)} />
        <Stat icon={Coins} accent="amber" label={t.cards.dividend} value={f.taka(r.dividends)} testId="returns-dividend" />
        <MoverStats t={t} f={f} r={r} />
      </div>
      <Footnote t={t} />

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
                  <th className="px-3 py-2 text-right font-medium">{t.table.unrealized}</th>
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
                    <td className={`px-3 py-2.5 text-right ${toneOf(s.unrealized)}`} data-col="unrealized">{s.unrealized === null ? '—' : f.signedTaka(s.unrealized)}</td>
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

/** Top Gainer / Top Loser of the year by gain in ৳ (stocks without a price are skipped). */
function MoverStats({ t, f, r }: { t: ReturnsDict; f: F; r: YearReturn }) {
  const { gainer, loser } = topMovers(r.stocks)
  return (
    <>
      <Stat
        testId="returns-top-gainer"
        icon={Trophy}
        accent="emerald"
        label={t.cards.topGainer}
        value={gainer?.symbol ?? '—'}
        hint={gainer ? f.signedTaka(gainer.gain) : t.hints.noGainer}
        hintTone={gainer ? `font-semibold ${toneOf(gainer.gain)}` : undefined}
      />
      <Stat
        testId="returns-top-loser"
        icon={ArrowDownRight}
        accent="rose"
        label={t.cards.topLoser}
        value={loser?.symbol ?? '—'}
        hint={loser ? f.signedTaka(loser.gain) : t.hints.noLoser}
        hintTone={loser ? `font-semibold ${toneOf(loser.gain)}` : undefined}
      />
    </>
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
    <div className="space-y-3">
      {missing.length > 0 && <MissingNotice t={t} missing={missing} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat testId="returns-cagr" icon={Gauge} accent={signAccent(s.cagr, 'indigo')} label={t.cards.cagr} value={cagrText} tone={toneOf(s.cagr)} hint={cagrHint} />
        <Stat testId="returns-cumulative" icon={TrendingUp} accent={signAccent(s.cumulativeReturn, 'fuchsia')} label={t.cards.cumulative} value={s.cumulativeReturn !== null ? f.pct(s.cumulativeReturn) : '—'} tone={toneOf(s.cumulativeReturn)} />
        <Stat icon={CalendarRange} accent="sky" label={t.cards.span} value={f.num(Math.round(s.span * 10) / 10)} />
        <Stat testId="returns-total-gain" icon={PiggyBank} accent={signAccent(s.totalGain, 'violet')} label={t.cards.totalGain} value={s.totalGain !== null ? f.signedTaka(s.totalGain) : '—'} tone={toneOf(s.totalGain)} />
        <Stat icon={Trophy} accent="emerald" label={t.cards.best} value={s.best ? `${yearLabel(s.best.year)} · ${f.pct(s.best.returnPct)}` : '—'} tone={toneOf(s.best?.returnPct)} />
        <Stat icon={ArrowDownRight} accent="rose" label={t.cards.worst} value={s.worst ? `${yearLabel(s.worst.year)} · ${f.pct(s.worst.returnPct)}` : '—'} tone={toneOf(s.worst?.returnPct)} />
        <Stat icon={HandCoins} accent="teal" label={t.cards.realized} value={f.signedTaka(s.totalRealized)} tone={toneOf(s.totalRealized)} />
        <Stat icon={Coins} accent="amber" label={t.cards.dividend} value={f.taka(s.totalDividends)} />
      </div>
      <Footnote t={t} />

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
                  <th className="px-3 py-2 text-right font-medium">{t.table.realized}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.table.unrealized}</th>
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
                    <td className="px-3 py-2.5 text-right" data-col="dividend">{f.taka(y.dividends)}</td>
                    <td className={`px-3 py-2.5 text-right ${toneOf(y.realized)}`} data-col="realized">{f.signedTaka(y.realized)}</td>
                    <td className={`px-3 py-2.5 text-right ${y.status === 'missing' ? '' : toneOf(y.unrealized)}`} data-col="unrealized">
                      {y.status === 'missing' ? '—' : f.signedTaka(y.unrealized)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${y.status === 'missing' ? '' : toneOf(y.gain)}`} data-col="gain">{y.status === 'missing' ? '—' : f.signedTaka(y.gain)}</td>
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
