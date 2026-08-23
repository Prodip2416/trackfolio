'use client'

import { useState, useEffect } from 'react'
import { Plus, Star } from 'lucide-react'
import { removeFromWatchlist } from '@/app/watchlist/actions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/shared/ConfirmModal'
import WatchlistTable from './WatchlistTable'
import AddStockModal from './AddStockModal'

type WatchlistItem = {
  id: string
  symbol: string
  company_name: string
  sector: string
  category: string
  current_price: number | null
  price_updated_at: string | null
  created_at: string
}

export default function WatchlistClient({ 
  initialWatchlist, 
  dict 
}: { 
  initialWatchlist: WatchlistItem[]
  dict?: any 
}) {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Delete states
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<{id: string, symbol: string} | null>(null)

  // Sync state with props when router.refresh() is called
  useEffect(() => {
    setWatchlist(initialWatchlist)
  }, [initialWatchlist])

  const handleRemove = async () => {
    if (!deleteItem) return
    const { id, symbol } = deleteItem

    setRemovingId(id)
    const result = await removeFromWatchlist(id)
    setRemovingId(null)
    setDeleteItem(null)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`${symbol} removed from watchlist`)
      router.refresh()
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
            My Watchlist
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track your favorite DSE stocks and get notified when prices hit your target.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Stock
        </button>
      </div>

      {/* Watchlist Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 transition-colors">
        <WatchlistTable 
          watchlist={watchlist} 
          onRemoveClick={(id, symbol) => setDeleteItem({ id, symbol })}
          removingId={removingId}
          onAddFirstStock={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Add Stock Modal */}
      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        watchlist={watchlist} 
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteItem}
        title={dict?.confirm?.deleteWatchlistTitle || 'Remove from Watchlist'}
        message={dict?.confirm?.deleteWatchlistMessage || 'Are you sure you want to remove this stock from your watchlist?'}
        isLoading={removingId !== null}
        onConfirm={handleRemove}
        onClose={() => setDeleteItem(null)}
        dict={dict}
      />
    </div>
  )
}