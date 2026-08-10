'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import DividendForm from '@/components/dividends/DividendForm'
import { deleteDividend } from '@/app/dividends/actions'
import ConfirmModal from '@/components/shared/ConfirmModal'

type Dividend = {
  id: string
  type: 'INTERIM' | 'FINAL'
  year: number
  percentage: number | null
  cash_amount: number | null
  bonus_quantity: number | null
  date: string
  note: string | null
  stocks: {
    symbol: string
    company_name: string
  }
}

export default function DividendsClient({ initialDividends }: { initialDividends: Dividend[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteDividendId, setDeleteDividendId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteDividendId) return
    setIsDeleting(true)
    await deleteDividend(deleteDividendId)
    setIsDeleting(false)
    setDeleteDividendId(null)
  }

  return (
    <div className="w-full">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dividend Info</h1>
            <p className="text-gray-500 mt-1">Manage and track your latest dividend income and bonus shares.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Dividend
          </button>
        </div>

        {/* Dividends Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {initialDividends.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No dividends logged yet</h3>
              <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
                Keep track of your cash and stock dividends.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Log Your First Dividend
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-700">Latest 10 Dividends</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Date & Year
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Cash (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Bonus Qty
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {initialDividends.map((div) => {
                    return (
                      <tr key={div.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900">{div.stocks?.symbol}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{div.stocks?.company_name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          <div className="font-medium text-gray-900">{new Date(div.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-gray-500">{div.year}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                            div.type === 'FINAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {div.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                          {div.cash_amount ? div.cash_amount.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                          {div.bonus_quantity ? div.bonus_quantity.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <button
                            onClick={() => setDeleteDividendId(div.id)}
                            disabled={deleteDividendId === div.id && isDeleting}
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                            title="Delete Dividend"
                          >
                            <Trash2 className="w-4 h-4 ml-auto" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <DividendForm onClose={() => setIsAddModalOpen(false)} />
      )}

      <ConfirmModal
        isOpen={!!deleteDividendId}
        title="Delete Dividend"
        message="Are you sure you want to delete this dividend record? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteDividendId(null)}
      />
    </div>
  )
}
