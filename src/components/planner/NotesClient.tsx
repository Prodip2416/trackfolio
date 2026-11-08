'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pin, PinOff, Pencil, Trash2, Search, NotebookPen, CalendarClock, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/shared/ConfirmModal'
import PremiumDatePicker from '@/components/shared/PremiumDatePicker'
import { runAction } from '@/lib/run-action'
import { todayLocal } from '@/lib/date'
import { isReviewDue } from '@/lib/planner-calc'
import { savePlannerNote, toggleNotePin, deletePlannerNote, type PlannerNote } from '@/app/planner/actions'
import { Modal, StockPicker, cardCls, inputCls, labelCls, type PickedCompany } from './shared'

const SUGGESTED_TAGS = ['idea', 'news', 'lesson', 'rule', 'decision']

export default function NotesClient({ notes, focusId }: { notes: PlannerNote[]; focusId?: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [view, setView] = useState<'ALL' | 'REVIEW' | 'DECISIONS'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlannerNote | null>(null)
  const [deleting, setDeleting] = useState<PlannerNote | null>(null)
  const [busy, setBusy] = useState(false)
  const today = todayLocal()

  useEffect(() => {
    if (!focusId) return
    document.getElementById(`note-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId])

  const allTags = useMemo(() => [...new Set(notes.flatMap(n => n.tags))].sort(), [notes])
  const reviewCount = notes.filter(n => isReviewDue(n.review_date, today)).length

  const visible = notes.filter(n => {
    if (view === 'REVIEW' && !isReviewDue(n.review_date, today)) return false
    if (view === 'DECISIONS' && !n.tags.includes('decision') && !n.outcome) return false
    if (tagFilter && !n.tags.includes(tagFilter)) return false
    const q = search.trim().toLowerCase()
    if (q) {
      const hay = `${n.title} ${n.body ?? ''} ${n.outcome ?? ''} ${n.symbol ?? ''} ${n.tags.join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  async function togglePin(n: PlannerNote) {
    const ok = await runAction(() => toggleNotePin(n.id), n.pinned ? 'Unpinned' : 'Pinned')
    if (ok) router.refresh()
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    const ok = await runAction(() => deletePlannerNote(deleting.id), 'Note deleted')
    setBusy(false)
    if (ok) {
      setDeleting(null)
      router.refresh()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Notes & Journal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ideas, rules, lessons and decisions — so you never forget why.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Note
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {([
            ['ALL', `All (${notes.length})`],
            ['REVIEW', `📅 Review due (${reviewCount})`],
            ['DECISIONS', 'Decisions']
          ] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer ${
                view === v ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className={`${inputCls} w-36`}>
            <option value="">All tags</option>
            {allTags.map(t => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes" className={`${inputCls} pl-9`} />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <NotebookPen className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {notes.length === 0 ? 'No notes yet. Write down your first idea or rule.' : 'No notes match these filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(n => {
            const due = isReviewDue(n.review_date, today)
            return (
              <div
                key={n.id}
                id={`note-${n.id}`}
                className={`${cardCls} p-4 flex flex-col ${n.pinned ? 'border-indigo-200 dark:border-indigo-800' : ''} ${
                  n.id === focusId ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white break-words min-w-0">
                    {n.pinned && <Pin className="inline w-3.5 h-3.5 mr-1 text-indigo-500 -mt-0.5" />}
                    {n.title}
                  </h3>
                  <div className="flex shrink-0">
                    <IconBtn title={n.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(n)}>
                      {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </IconBtn>
                    <IconBtn
                      title="Edit"
                      onClick={() => {
                        setEditing(n)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </IconBtn>
                    <IconBtn title="Delete" danger onClick={() => setDeleting(n)}>
                      <Trash2 className="w-4 h-4" />
                    </IconBtn>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {n.symbol && <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{n.symbol}</span>}
                  {n.tags.map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTagFilter(t)}
                      className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700"
                    >
                      #{t}
                    </button>
                  ))}
                  {n.review_date && (
                    <span
                      className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md ${
                        due ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-semibold' : 'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
                      }`}
                    >
                      <CalendarClock className="w-3 h-3 mr-1" /> {n.review_date}
                    </span>
                  )}
                </div>

                {n.body && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words line-clamp-6">{n.body}</p>}

                {n.outcome && (
                  <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center text-xs font-semibold mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Outcome
                    </div>
                    <p className="whitespace-pre-wrap break-words">{n.outcome}</p>
                  </div>
                )}

                <div className="mt-auto pt-3 text-[11px] text-gray-400">Updated {n.updated_at.slice(0, 10)}</div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <NoteFormModal
          note={editing ?? undefined}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title="Delete note?"
        message={deleting ? `Delete “${deleting.title}”? This cannot be undone.` : ''}
        isLoading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}

function IconBtn({ children, title, onClick, danger = false }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-gray-400 cursor-pointer ${danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-indigo-600 hover:bg-indigo-50'} dark:hover:bg-slate-800`}
    >
      {children}
    </button>
  )
}

function NoteFormModal({ note, onClose }: { note?: PlannerNote; onClose: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [company, setCompany] = useState<PickedCompany | null>(
    note?.symbol ? { symbol: note.symbol, company_name: note.company_name ?? '', current_price: null } : null
  )
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '')
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [reviewDate, setReviewDate] = useState(note?.review_date ?? '')
  const [outcome, setOutcome] = useState(note?.outcome ?? '')
  const [saving, setSaving] = useState(false)

  const currentTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  const addTag = (t: string) => {
    if (currentTags.includes(t)) return
    setTags([...currentTags, t].join(', '))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return toast.error('Title is required.')
    setSaving(true)
    const ok = await runAction(
      () =>
        savePlannerNote({
          id: note?.id ?? null,
          symbol: company?.symbol ?? null,
          title,
          body,
          tags,
          pinned,
          review_date: reviewDate || null,
          outcome
        }),
      note ? 'Note updated' : 'Note saved'
    )
    setSaving(false)
    if (ok) {
      router.refresh()
      onClose()
    }
  }

  return (
    <Modal title={note ? 'Edit Note' : 'New Note'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className={labelCls}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Never average down more than twice" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Note</label>
          <textarea rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Details, reasoning, decision…" className={`${inputCls} resize-y`} />
        </div>
        <div>
          <label className={labelCls}>Linked stock (optional)</label>
          <StockPicker value={company} onChange={setCompany} />
        </div>
        <div>
          <label className={labelCls}>Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="idea, news" className={inputCls} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_TAGS.map(t => (
              <button
                type="button"
                key={t}
                onClick={() => addTag(t)}
                disabled={currentTags.includes(t)}
                className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className={labelCls}>Review date (optional)</label>
            <div className="flex gap-2 items-center">
              <PremiumDatePicker
                value={reviewDate}
                onChange={setReviewDate}
                placement="top"
                placeholder="No date"
                className="flex-1"
                buttonClassName="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm min-h-[42px]"
              />
              {reviewDate && (
                <button type="button" onClick={() => setReviewDate('')} className="text-xs text-gray-500 hover:text-red-600 cursor-pointer">
                  Clear
                </button>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer pb-2.5">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            Pin to top
          </label>
        </div>
        <div>
          <label className={labelCls}>Outcome (fill in later — what actually happened?)</label>
          <textarea rows={2} value={outcome} onChange={e => setOutcome(e.target.value)} className={`${inputCls} resize-y`} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-70 cursor-pointer"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {note ? 'Update Note' : 'Save Note'}
        </button>
      </form>
    </Modal>
  )
}
