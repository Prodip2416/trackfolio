'use client'

import Link from 'next/link'
import { ChevronRight, FileSearch, Ticket } from 'lucide-react'
import type { BondSummary } from '@/lib/prize-bond/winnings'
import { makeFmt, type PrizeBondDict } from './shared'

export default function PrizeBondSummaryCard({ summary: s, t }: { summary: BondSummary; t: PrizeBondDict }) {
  const f = makeFmt(t)
  const items = [
    { label: t.bonds.totalBonds, value: f.num(s.bondCount), sub: `${t.bonds.activeBonds}: ${f.num(s.activeCount)}` },
    { label: t.bonds.invested, value: f.taka(s.invested), sub: t.bonds.investedSub }
  ]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5" data-testid="pb-dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h3>
        </div>
        <Link href="/prize-bond" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center">
          {t.dashboard.open} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(i => (
          <Link key={i.label} href="/prize-bond" className="rounded-xl p-3 bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <p className="text-xs text-gray-500 dark:text-gray-400">{i.label}</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{i.value}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{i.sub}</p>
          </Link>
        ))}
        <Link
          href="/prize-bond/draws"
          className="col-span-2 lg:col-span-1 rounded-xl p-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm"
        >
          <FileSearch className="w-5 h-5" /> {t.dashboard.check}
        </Link>
      </div>
    </div>
  )
}
