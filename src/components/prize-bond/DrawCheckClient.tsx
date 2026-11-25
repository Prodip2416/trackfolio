'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, FileUp, Loader2, RotateCcw, SearchX, Trophy } from 'lucide-react'
import { warningText } from '@/lib/prize-bond/i18n'
import { checkDrawPdf, type DrawCheckResult } from '@/app/prize-bond/actions'
import { MAC_FONT, MAC_MONO, MacHeader, RANK_STYLES, TrafficLights, callAction, fmt, glass, macPrimary, macSecondary, makeFmt, type PrizeBondDict } from './shared'

/** Draw Check: one result PDF → read → compare with the user's bonds → show matches or "no match". */
export default function DrawCheckClient({ bondCount, t }: { bondCount: number; t: PrizeBondDict }) {
  const f = makeFmt(t)
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<DrawCheckResult | null>(null)
  const [showNumbers, setShowNumbers] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // A PDF dropped anywhere else on the page must not make the browser open it (leaving the app).
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', stop)
    window.addEventListener('drop', stop)
    return () => {
      window.removeEventListener('dragover', stop)
      window.removeEventListener('drop', stop)
    }
  }, [])

  async function check(file: File | undefined) {
    if (!file || checking) return
    setFileName(file.name)
    setResult(null)
    setShowNumbers(false)
    setChecking(true)
    const fd = new FormData()
    fd.set('file', file)
    const r = await callAction(() => checkDrawPdf(fd), { fallback: t.errors.unreadablePdf })
    setChecking(false)
    if (r) setResult(r)
  }

  function reset() {
    setResult(null)
    setFileName('')
    setShowNumbers(false)
  }

  const eligible = result?.matches.filter(m => m.eligibility === 'ELIGIBLE') ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0 antialiased" style={MAC_FONT}>
      <MacHeader title={t.check.title} subtitle={t.check.subtitle} />

      {bondCount === 0 && (
        <div className={`${glass} rounded-2xl p-4 text-[13px] text-gray-700 dark:text-gray-300 flex items-center gap-2`}>
          <AlertTriangle className="w-4 h-4 text-[#ff9f0a] shrink-0" />
          <span>{t.check.noBonds}</span>
          <Link href="/prize-bond" className="ml-auto text-[#007aff] font-medium hover:underline whitespace-nowrap">
            {t.bonds.title} →
          </Link>
        </div>
      )}

      {/* Upload — one PDF at a time */}
      {!result && (
        <div className={`${glass} rounded-2xl overflow-hidden`}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <TrafficLights />
            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t.check.title}</span>
          </div>
          <button
            type="button"
            disabled={checking}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              check(e.dataTransfer.files?.[0])
            }}
            className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-16 transition-colors cursor-pointer disabled:cursor-wait ${
              dragOver ? 'bg-[#007aff]/[0.08]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
            }`}
            data-testid="pb-check-drop"
          >
            {checking ? (
              <>
                <Loader2 className="w-10 h-10 text-[#007aff] animate-spin" />
                <p className="text-[14px] font-medium text-gray-700 dark:text-gray-200">{fmt(t.check.checking, { name: fileName })}</p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-[#3b9bff] to-[#007aff] shadow-[0_8px_20px_-6px_rgba(0,122,255,0.55)]">
                  <FileUp className="w-8 h-8 text-white" />
                </span>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white">{t.check.drop}</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">{t.check.dropHint}</p>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            data-testid="pb-check-file"
            onChange={e => {
              const file = e.target.files?.[0]
              e.target.value = '' // allow re-checking the same file
              check(file)
            }}
          />
        </div>
      )}

      {result && (
        <div className="space-y-4" data-testid="pb-check-result">
          {/* Draw header */}
          <div className={`${glass} rounded-2xl p-4 flex flex-wrap items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-[20px] font-semibold tracking-[-0.01em] text-gray-900 dark:text-white" data-testid="pb-check-draw">
                {result.drawNo ? fmt(t.check.drawNo, { no: result.drawNo }) : t.check.unknownDraw}
                {result.drawDate && <span className="ml-2 text-[14px] font-normal text-gray-500 dark:text-gray-400">{f.date(result.drawDate)}</span>}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                {result.fileName} · {fmt(t.check.checked, { count: f.num(result.checkedCount) })}
              </p>
            </div>
            {result.valid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#34c759]/12 text-[#248a3d] dark:text-[#30d158]">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t.check.verified}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#ff9f0a]/15 text-[#c93400] dark:text-[#ffb340]">
                <AlertTriangle className="w-3.5 h-3.5" /> {t.check.needsReview}
              </span>
            )}
            <button type="button" className={macSecondary} onClick={reset} data-testid="pb-check-again">
              <RotateCcw className="w-3.5 h-3.5" /> {t.check.checkAnother}
            </button>
          </div>

          {result.warnings.length > 0 && (
            <ul className="text-[12px] space-y-0.5 text-[#c93400] dark:text-[#ffb340] px-1">
              {result.warnings.map((w, i) => (
                <li key={i}>• {warningText(t, w)}</li>
              ))}
            </ul>
          )}

          {/* Verdict */}
          {result.matches.length === 0 ? (
            <div className={`${glass} rounded-2xl py-12 text-center`} data-testid="pb-check-nomatch">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
                <SearchX className="w-7 h-7 text-gray-400" />
              </span>
              <p className="mt-3 text-[20px] font-semibold text-gray-900 dark:text-white">{t.check.noMatch}</p>
              <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">{fmt(t.check.noMatchSub, { count: f.num(result.checkedCount) })}</p>
              {!result.valid && (
                <p className="mt-2 text-[12px] font-medium text-[#c93400] dark:text-[#ffb340]" data-testid="pb-check-nomatch-incomplete">
                  ⚠ {t.check.noMatchIncomplete}
                </p>
              )}
            </div>
          ) : (
            <div className={`${glass} rounded-2xl overflow-hidden`} data-testid="pb-check-matches">
              <div className="px-4 py-3 bg-gradient-to-r from-[#ff9f0a]/15 to-[#ffd60a]/10 border-b border-black/[0.06] dark:border-white/[0.08]">
                {eligible.length > 0 && <p className="text-[17px] font-semibold text-gray-900 dark:text-white">{fmt(t.check.matchTitle, { count: f.num(eligible.length) })}</p>}
                {result.matches.length > eligible.length && (
                  <p className={`${eligible.length > 0 ? 'text-[12px] mt-0.5' : 'text-[15px] font-semibold'} text-gray-600 dark:text-gray-300`}>
                    {fmt(t.check.notEligibleCount, { count: f.num(result.matches.length - eligible.length) })}
                  </p>
                )}
                {result.recorded > 0 && (
                  <p className="text-[12px] text-[#248a3d] dark:text-[#30d158] mt-0.5" data-testid="pb-check-recorded">
                    ✓ {fmt(t.check.recorded, { count: f.num(result.recorded) })} ·{' '}
                    <Link href="/prize-bond/winnings" className="text-[#007aff] hover:underline">
                      {t.check.openWinnings}
                    </Link>
                  </p>
                )}
                {result.recorded === 0 && eligible.length > 0 && !result.notRecordedReason && (
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{t.check.alreadyRecorded}</p>
                )}
                {result.notRecordedReason && (
                  <p className="text-[12px] text-[#c93400] dark:text-[#ffb340] mt-0.5">
                    {result.notRecordedReason === 'FUTURE_DATE' ? t.check.notRecordedFuture : t.check.notRecordedIncomplete}
                  </p>
                )}
              </div>
              <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {result.matches.map((m, i) => (
                  <li
                    key={`${m.bond_id}-${m.rank}-${i}`}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${m.eligibility !== 'ELIGIBLE' ? 'opacity-60' : ''}`}
                    data-testid={`pb-check-match-${m.number}`}
                  >
                    <Trophy className={`w-5 h-5 ${m.eligibility === 'ELIGIBLE' ? 'text-[#ff9f0a]' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold tabular-nums text-gray-900 dark:text-white" style={MAC_MONO}>
                        {m.series ? `${m.series}-` : ''}
                        {m.number}
                      </p>
                      {m.holder && <p className="text-[12px] text-gray-500 dark:text-gray-400">{m.holder}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${RANK_STYLES[m.rank]}`}>{t.rank[String(m.rank) as '1']}</span>
                    <div className="ml-auto text-right">
                      <p className="text-[16px] font-semibold tabular-nums text-gray-900 dark:text-white">{f.taka(m.gross)}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t.winnings.net}: {f.taka(m.net)}
                      </p>
                    </div>
                    <p className="basis-full text-[11px] text-gray-500 dark:text-gray-400 pl-8">
                      {m.eligibility === 'TOO_NEW'
                        ? t.check.tooNew
                        : m.eligibility === 'ENCASHED'
                          ? t.check.encashedBefore
                          : m.deadline && fmt(t.check.deadline, { date: f.date(m.deadline) })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* All winning numbers (collapsible) */}
          <div className={`${glass} rounded-2xl overflow-hidden`}>
            <button
              type="button"
              onClick={() => setShowNumbers(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
            >
              {t.check.winningNumbers}
              <span className="inline-flex items-center gap-1 text-[#007aff]">
                {showNumbers ? t.check.hide : t.check.show}
                {showNumbers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            {showNumbers && (
              <div className="px-4 pb-4 space-y-3 border-t border-black/[0.06] dark:border-white/[0.08] pt-3" data-testid="pb-check-numbers">
                {result.prizes.map(p => (
                  <div key={p.rank}>
                    <p className="text-[12px] mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${RANK_STYLES[p.rank]}`}>{t.rank[String(p.rank) as '1']}</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-300 tabular-nums">{f.taka(p.amount)}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.numbers.map((n, i) => {
                        const mine = result.matches.some(m => m.number === n)
                        return (
                          <span
                            key={`${n}-${i}`}
                            style={MAC_MONO}
                            className={`text-[12px] px-2 py-1 rounded-md tabular-nums ${
                              mine ? 'bg-[#ff9f0a] text-white font-semibold' : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {n}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button type="button" className={macPrimary} onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" /> {t.check.checkAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
