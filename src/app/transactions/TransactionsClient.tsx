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
    <div className="w-full">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trade Log</h1>
            <p className="text-gray-500 mt-1">Manage and track your latest 10 trades.</p>
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
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {initialTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
              <p className="text-gray-500 mt-1 mb-6 max-w-sm mx-auto">
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
            <div className="overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-700">Latest 10 Trades</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Price (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Fee (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Total (৳)
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {initialTransactions.map((txn) => {
                    const total = (txn.quantity * txn.price_per_unit) + (txn.type === 'BUY' ? txn.brokerage_fee : -txn.brokerage_fee)
                    
                    return (
                      <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-900">{txn.stocks?.symbol}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{txn.stocks?.company_name}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                          {new Date(txn.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            txn.type === 'BUY' ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                          {txn.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                          {txn.price_per_unit.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 text-right hidden sm:table-cell">
                          {txn.brokerage_fee?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-semibold text-gray-900 text-right">
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
                              className="text-indigo-600 hover:text-indigo-900 transition-colors disabled:opacity-50"
                              title="Edit Transaction"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTransactionId(txn.id)}
                              disabled={deleteTransactionId === txn.id && isDeleting}
                              className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
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
          )}
        </div>
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
