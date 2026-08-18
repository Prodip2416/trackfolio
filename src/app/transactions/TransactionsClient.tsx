'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import SmartTransactionForm from '@/components/transactions/SmartTransactionForm'
import { deleteTransaction } from '@/app/transactions/actions'
import ConfirmModal from '@/components/shared/ConfirmModal'

type Transaction = {
  id: string
  type: 'BUY' | 'SELL'
  quantity: number
  price_per_unit: number
  transaction_date: string
  brokerage_fee: number
  stocks: {
    symbol: string
    company_name: string
  }
}

export default function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteTransactionId) return
    setIsDeleting(true)
    await deleteTransaction(deleteTransactionId)
    setIsDeleting(false)
    setDeleteTransactionId(null)
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Trade Log</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage and track your latest trades.</p>
        </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Trade
          </button>
        </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 transition-colors">
          {initialTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No transactions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm mx-auto">
                Log your first buy or sell order to start building your portfolio.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Trade
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 transition-colors">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Latest 10 Trades</h3>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 relative transition-colors">
                  <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors backdrop-blur-md">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Stock
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Price (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider hidden sm:table-cell">
                      Fee (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Total (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                  {initialTransactions.map((txn) => {
                    const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                    
                    return (
                      <tr key={txn.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900 dark:text-white">{txn.stocks?.symbol}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{txn.stocks?.company_name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            txn.type === 'BUY' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right font-medium">
                          {txn.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right">
                          {txn.price_per_unit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">
                          {txn.brokerage_fee?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-white text-right">
                          {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => setEditTransaction({
                                id: txn.id,
                                symbol: txn.stocks?.symbol,
                                company_name: txn.stocks?.company_name,
                                type: txn.type,
                                quantity: txn.quantity,
                                price_per_unit: txn.price_per_unit,
                                transaction_date: txn.transaction_date,
                                brokerage_fee: txn.brokerage_fee || 0
                              })}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                              title="Edit Transaction"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTransactionId(txn.id)}
                              disabled={deleteTransactionId === txn.id && isDeleting}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>

      {isAddModalOpen && (
        <SmartTransactionForm onClose={() => setIsAddModalOpen(false)} />
      )}

      {editTransaction && (
        <SmartTransactionForm 
          onClose={() => setEditTransaction(null)} 
          initialData={editTransaction} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTransactionId}
        title="Delete Transaction"
        message="Are you sure you want to delete this trade log? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTransactionId(null)}
      />
    </div>
  )
}
