'use client'

import { useState, useEffect } from 'react'
import { Plus, Bell } from 'lucide-react'
import { deletePriceAlert } from '@/app/watchlist/actions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/shared/ConfirmModal'
import PriceAlertsTable from './PriceAlertsTable'
import PriceAlertFormModal from './PriceAlertFormModal'

type PriceAlert = {
  id: string
  symbol: string
  company_name: string
  sector: string
  current_price: number | null
  buy_min_price: number | null
  buy_max_price: number | null
  sell_min_price: number | null
  sell_max_price: number | null
  is_buy_triggered: boolean
  is_sell_triggered: boolean
  buy_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  sell_status: 'in_range' | 'below_range' | 'above_range' | 'none'
  created_at: string
}

type WatchlistSymbol = {
  symbol: string
  company_name: string
  current_price: number | null
}

export default function PriceAlertsClient({ 
  initialAlerts, 
  watchlistSymbols,
  dict 
}: { 
  initialAlerts: PriceAlert[]
  watchlistSymbols: WatchlistSymbol[]
  dict?: any 
}) {
  const router = useRouter()
  const [alerts, setAlerts] = useState<PriceAlert[]>(initialAlerts)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null)
  
  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<{id: string, symbol: string} | null>(null)

  // Sync state with props when router.refresh() is called
  useEffect(() => {
    setAlerts(initialAlerts)
  }, [initialAlerts])

  const openAddModal = () => {
    setEditingAlert(null)
    setIsModalOpen(true)
  }

  const openEditModal = (alert: PriceAlert) => {
    setEditingAlert(alert)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    const { id, symbol } = deleteItem

    setDeletingId(id)
    const result = await deletePriceAlert(id)
    setDeletingId(null)
    setDeleteItem(null)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Alert for ${symbol} deleted`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-indigo-500" />
            Price Alerts
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set buy/sell price ranges. Get notified when live price enters your range.
          </p>
        </div>
        <button
          onClick={openAddModal}
          disabled={watchlistSymbols.length === 0}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Alert
        </button>
      </div>

      {watchlistSymbols.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-400">
          <p className="font-semibold">No stocks in your watchlist yet.</p>
          <p className="mt-1 text-xs">Add stocks to your watchlist first, then set price alerts for them.</p>
        </div>
      )}

      {/* Alerts Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 transition-colors">
        <PriceAlertsTable 
          alerts={alerts}
          watchlistSymbols={watchlistSymbols}
          openAddModal={openAddModal}
          openEditModal={openEditModal}
          setDeleteItem={setDeleteItem}
          deletingId={deletingId}
        />
      </div>

      {/* Add/Edit Alert Modal */}
      <PriceAlertFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAlert={editingAlert}
        watchlistSymbols={watchlistSymbols}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteItem}
        title={dict?.confirm?.deleteAlertTitle || 'Delete Price Alert'}
        message={dict?.confirm?.deleteAlertMessage || 'Are you sure you want to delete this price alert? This action cannot be undone.'}
        isLoading={deletingId !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
        dict={dict}
      />
    </div>
  )
}