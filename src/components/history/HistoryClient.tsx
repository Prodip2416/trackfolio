'use client'

import { useState, useMemo, useEffect } from 'react'
import { getHistoryData } from '@/app/history/actions'
import SmartTransactionForm from '@/components/transactions/SmartTransactionForm'
import DividendForm from '@/components/dividends/DividendForm'
import ConfirmModal from '@/components/shared/ConfirmModal'
import { deleteTransaction } from '@/app/transactions/actions'
import { deleteDividend } from '@/app/dividends/actions'

import HistoryTabs from './HistoryTabs'
import HistoryFilters from './HistoryFilters'
import HistoryTable from './HistoryTable'

export default function HistoryClient({ 
  uniqueStocks, 
  uniqueYears 
}: { 
  uniqueStocks: string[], 
  uniqueYears: string[] 
}) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'DIVIDEND'>('BUY')
  const [filterStock, setFilterStock] = useState('ALL')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [filterMonth, setFilterMonth] = useState('ALL')
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Server Data State
  const [data, setData] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentTotal, setCurrentTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Edit/Delete State
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [editDividend, setEditDividend] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'TRANSACTION' | 'DIVIDEND' | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return
    setIsDeleting(true)
    if (deleteType === 'TRANSACTION') {
      await deleteTransaction(deleteId)
    } else {
      await deleteDividend(deleteId)
    }
    setIsDeleting(false)
    setDeleteId(null)
    setDeleteType(null)
    setRefreshTrigger(p => p + 1)
  }

  // Reset page and data when filters change to prevent mismatched data crashes
  useEffect(() => {
    setCurrentPage(1)
    setData([]) // Clear data so old tab's data doesn't render in new tab's columns
  }, [activeTab, filterStock, filterYear, filterMonth])

  // Fetch data from backend whenever filters or page change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getHistoryData({
          activeTab,
          filterStock,
          filterYear,
          filterMonth,
          currentPage,
          itemsPerPage
        })
        
        setData(result.data)
        setTotalPages(result.totalPages)
        setTotalRecords(result.totalRecords)
        setCurrentTotal(result.currentTotal)
      } catch (error) {
        console.error("Failed to fetch history data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, filterStock, filterYear, filterMonth, currentPage, refreshTrigger])


  const yearOptions = useMemo(() => {
    const options = [{ label: 'All Years', value: 'ALL' }]
    for (let i = 2010; i <= 2075; i++) {
      options.push({ label: i.toString(), value: i.toString() })
    }
    return options
  }, [])

  const monthOptions = useMemo(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const options = [{ label: 'All Months', value: 'ALL' }]
    monthNames.forEach((m, i) => {
      options.push({ label: m, value: (i + 1).toString() })
    })
    return options
  }, [])

  // Format stock options
  const stockOptions = useMemo(() => {
    const options = [{ label: 'All Stocks', value: 'ALL' }]
    uniqueStocks.forEach(sym => {
      options.push({ label: sym, value: sym })
    })
    return options
  }, [uniqueStocks])

  const handleTabChange = (tab: 'BUY' | 'SELL' | 'DIVIDEND') => {
    setActiveTab(tab)
    setData([])
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-4 px-4 sm:px-0">
      
      <HistoryTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        currentTotal={currentTotal} 
      />

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-2xl relative transition-colors flex-1 flex flex-col min-h-0">
        
        <HistoryFilters 
          stockOptions={stockOptions}
          yearOptions={yearOptions}
          monthOptions={monthOptions}
          filterStock={filterStock}
          setFilterStock={setFilterStock}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          totalRecords={totalRecords}
        />
        
        <HistoryTable 
          data={data}
          activeTab={activeTab}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          setEditTransaction={setEditTransaction}
          setEditDividend={setEditDividend}
          setDeleteId={setDeleteId}
          setDeleteType={setDeleteType}
          isDeleting={isDeleting}
        />

      </div>

      {editTransaction && (
        <SmartTransactionForm 
          onClose={() => { setEditTransaction(null); setRefreshTrigger(p => p + 1); }} 
          initialData={editTransaction} 
        />
      )}

      {editDividend && (
        <DividendForm 
          onClose={() => { setEditDividend(null); setRefreshTrigger(p => p + 1); }} 
          initialData={editDividend} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title={`Delete ${deleteType === 'TRANSACTION' ? 'Trade Log' : 'Dividend'}`}
        message={`Are you sure you want to delete this ${deleteType === 'TRANSACTION' ? 'trade log' : 'dividend'}? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => { setDeleteId(null); setDeleteType(null); }}
      />
    </div>
  )
}
