'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Banknote, FileSearch, Trash2, Trophy } from 'lucide-react'
import ConfirmModal from '@/components/shared/ConfirmModal'
import type { WinRow } from '@/lib/prize-bond/service'
import { summarizeWins } from '@/lib/prize-bond/winnings'
import { deleteWin } from '@/app/prize-bond/actions'
import { MAC_FONT, MAC_MONO, MacHeader, MacStat, RANK_STYLES, TrafficLights, callAction, fmt, glass, macPrimary, makeFmt, type PrizeBondDict } from './shared'

export default function WinningsClient({ wins, t, confirmDict }: { wins: WinRow[]; t: PrizeBondDict; confirmDict: unknown }) {
  const router = useRouter()
  const f = makeFmt(t)
  const [deleting, setDeleting] = useState<WinRow | null>(null)
  const [busy, setBusy] = useState(false)
  const s = summarizeWins(wins.map(w => ({ amount: w.gross })))

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const ok = await callAction(() => deleteWin(deleting.id), { success: t.toast.winDeleted, fallback: t.errors.deleteFailed })
    setBusy(false)
    if (ok) {
      setDeleting(null)
      router.refresh()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0 antialiased" style={MAC_FONT}>
      <MacHeader
        title={t.winnings.title}
        subtitle={t.winnings.subtitle}
        actions={
          <Link href="/prize-bond/draws" className={macPrimary}>
            <FileSearch className="w-4 h-4" /> {t.dashboard.check}
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MacStat testId="pb-win-total" icon={Banknote} tone="green" label={t.winnings.totalWon} value={f.taka(s.net)} />
        <MacStat icon={Trophy} tone="orange" label={t.winnings.count} value={f.num(s.count)} />
        <MacStat icon={Banknote} tone="pink" label={t.winnings.gross} value={f.taka(s.gross)} />
      </div>

      <div className={`${glass} rounded-2xl overflow-hidden`}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <TrafficLights />
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t.winnings.title}</span>
        </div>
        {wins.length === 0 ? (
          <div className="py-16 text-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
              <Trophy className="w-7 h-7 text-gray-400" />
            </span>
            <p className="mt-3 text-[13px] text-gray-500 dark:text-gray-400">{t.winnings.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]" data-testid="pb-win-table">
              <thead>
                <tr className="text-[11px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <th className="pl-4 pr-3 py-2 text-left font-medium">{t.common.number}</th>
                  <th className="px-3 py-2 text-left font-medium">{t.winnings.draw}</th>
                  <th className="px-3 py-2 text-left font-medium">{t.winnings.prize}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.winnings.gross}</th>
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">{t.winnings.net}</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">{t.winnings.deadline}</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">{t.winnings.foundOn}</th>
                  <th className="pl-3 pr-4 py-2 text-right font-medium">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {wins.map(w => (
                  <tr key={w.id} data-testid={`pb-win-${w.number}-${w.draw_no}`} className="group even:bg-black/[0.018] dark:even:bg-white/[0.025] hover:bg-black/[0.035] dark:hover:bg-white/[0.05]">
                    <td className="pl-4 pr-3 py-2.5">
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-white" style={MAC_MONO}>
                        {w.series ? `${w.series}-` : ''}
                        {w.number}
                      </p>
                      {w.holder && <p className="text-[11px] text-gray-500 dark:text-gray-400">{w.holder}</p>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="font-semibold text-gray-900 dark:text-white">#{w.draw_no}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{f.date(w.draw_date)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${RANK_STYLES[w.rank]}`}>{t.rank[String(w.rank) as '1']}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap">{f.taka(w.gross)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white whitespace-nowrap">{f.taka(w.net)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{f.date(w.deadline)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400">{f.date(w.found_at.slice(0, 10))}</td>
                    <td className="pl-3 pr-4 py-2.5 text-right">
                      <button
                        type="button"
                        aria-label={`${t.common.delete} ${w.number} #${w.draw_no}`}
                        onClick={() => setDeleting(w)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 cursor-pointer opacity-70 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleting}
        title={t.confirm.deleteWinTitle}
        message={fmt(t.confirm.deleteWinMessage, { number: deleting ? `${deleting.series ? `${deleting.series}-` : ''}${deleting.number}` : '', no: deleting?.draw_no ?? '' })}
        isLoading={busy}
        onConfirm={confirmDelete}
        onClose={() => !busy && setDeleting(null)}
        dict={confirmDict}
      />
    </div>
  )
}
