import Link from 'next/link'
import { NotebookPen, BellRing, CalendarClock, Target, Pin, ShieldAlert, ChevronRight } from 'lucide-react'
import type { PlannerSnapshot } from '@/lib/planner-snapshot'

const tk = (n: number) => `৳${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PlannerSnapshotCard({ snapshot }: { snapshot: PlannerSnapshot }) {
  const { targetHits, stopLossHits, reviewPlans, reviewNotes, activeCount, ideaCount, openBuyValue, pinnedNotes } = snapshot
  const reviewTotal = reviewPlans.length + reviewNotes.length
  const isEmpty = activeCount + ideaCount === 0 && pinnedNotes.length === 0 && reviewNotes.length === 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900 dark:text-white">Planner Snapshot</h3>
        </div>
        <Link href="/planner" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center">
          Open Planner <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isEmpty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No plans or notes yet.{' '}
          <Link href="/planner" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Create your first trade plan →
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Section icon={<Target className="w-4 h-4 text-indigo-500" />} title="Open plans">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount + ideaCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              🎯 {activeCount} active · 💡 {ideaCount} idea
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Planned buys: <span className="font-semibold text-gray-800 dark:text-gray-200">{tk(openBuyValue)}</span>
            </div>
          </Section>

          <Section icon={<BellRing className="w-4 h-4 text-emerald-500" />} title={`Target hit (${targetHits.length})`}>
            {targetHits.length === 0 && stopLossHits.length === 0 ? (
              <Empty text="No plan has reached its price." />
            ) : (
              <ul className="space-y-1">
                {targetHits.slice(0, 4).map(h => (
                  <Item key={h.id} href={`/planner?focus=${h.id}`}>
                    <span className={`font-bold ${h.type === 'BUY' ? 'text-indigo-600' : 'text-red-600'}`}>{h.type}</span> {h.symbol}{' '}
                    <span className="text-gray-500 dark:text-gray-400">
                      {tk(h.current_price)} / plan {tk(h.price)}
                    </span>
                  </Item>
                ))}
                {stopLossHits.slice(0, 3).map(h => (
                  <Item key={`sl-${h.id}`} href={`/planner?focus=${h.id}`}>
                    <ShieldAlert className="inline w-3.5 h-3.5 text-red-500 -mt-0.5" /> {h.symbol}{' '}
                    <span className="text-red-600 dark:text-red-400">stop-loss {tk(h.stop_loss)}</span>
                  </Item>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={<CalendarClock className="w-4 h-4 text-amber-500" />} title={`Review today (${reviewTotal})`}>
            {reviewTotal === 0 ? (
              <Empty text="Nothing to review today." />
            ) : (
              <ul className="space-y-1">
                {reviewPlans.slice(0, 3).map(p => (
                  <Item key={p.id} href={`/planner?focus=${p.id}`}>
                    {p.type} {p.symbol} <span className="text-gray-400">· {p.review_date}</span>
                  </Item>
                ))}
                {reviewNotes.slice(0, 3).map(n => (
                  <Item key={n.id} href={`/planner/notes?focus=${n.id}`}>
                    📝 {n.title} <span className="text-gray-400">· {n.review_date}</span>
                  </Item>
                ))}
              </ul>
            )}
          </Section>

          <Section icon={<Pin className="w-4 h-4 text-indigo-500" />} title="Pinned notes">
            {pinnedNotes.length === 0 ? (
              <Empty text="No pinned notes." />
            ) : (
              <ul className="space-y-1">
                {pinnedNotes.map(n => (
                  <Item key={n.id} href={`/planner/notes?focus=${n.id}`}>
                    {n.symbol && <span className="font-semibold text-indigo-600 dark:text-indigo-400">{n.symbol} </span>}
                    {n.title}
                  </Item>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li className="text-sm truncate">
      <Link href={href} className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400">
        {children}
      </Link>
    </li>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-gray-400">{text}</p>
}
