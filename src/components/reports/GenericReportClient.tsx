'use client'

import { useState, useMemo, useEffect } from 'react'
import { Filter, Download, Loader2 } from 'lucide-react'
import SearchableDropdown from '@/components/shared/SearchableDropdown'
import { getFilteredReportData } from '@/app/reports/actions'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type ReportType = 'BUY' | 'SELL' | 'DIVIDEND'

export default function GenericReportClient({
  reportType,
  uniqueStocks,
  uniqueYears,
  dict
}: {
  reportType: ReportType
  uniqueStocks: string[]
  uniqueYears: string[]
  dict?: any
}) {
  const [filterStock, setFilterStock] = useState('ALL')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const yearOptions = useMemo(() => {
    const options = [{ label: dict?.reports?.allYears || 'All Years', value: 'ALL' }]
    for (let i = 2025; i <= 2075; i++) {
      options.push({ label: i.toString(), value: i.toString() })
    }
    return options
  }, [])

  const stockOptions = useMemo(() => {
    const options = [{ label: dict?.reports?.allStocks || 'All Stocks', value: 'ALL' }]
    uniqueStocks.forEach(sym => {
      options.push({ label: sym, value: sym })
    })
    return options
  }, [uniqueStocks])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const result = await getFilteredReportData({
          reportType,
          filterStock,
          filterYear
        })
        setData(result)
      } catch (error) {
        console.error("Failed to fetch report data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [reportType, filterStock, filterYear])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleExportCSV = () => {
    if (data.length === 0) return

    let csvContent = ''
    if (reportType === 'DIVIDEND') {
      csvContent = 'Stock,Company Name,Date,Type,Cash Amount (Tk),Bonus Shares\n'
      data.forEach(row => {
        csvContent += `"${row.symbol}","${row.company_name}","${formatDate(row.date)}","${row.type}","${row.cash_amount || 0}","${row.bonus_quantity || 0}"\n`
      })
    } else {
      csvContent = 'Stock,Company Name,Date,Type,Quantity,Price (Tk),Fee (Tk),Total Value (Tk)\n'
      data.forEach(row => {
        const total = (row.quantity * row.price_per_unit) + (reportType === 'BUY' ? row.brokerage_fee : -row.brokerage_fee)
        csvContent += `"${row.symbol}","${row.company_name}","${formatDate(row.date)}","${row.type}","${row.quantity}","${row.price_per_unit}","${row.brokerage_fee}","${total}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${reportType.toLowerCase()}_report_${filterYear}_${filterStock}.csv`)
  }

  const handleExportExcel = () => {
    if (data.length === 0) return

    let exportData = []
    if (reportType === 'DIVIDEND') {
      exportData = data.map(row => ({
        'Stock': row.symbol,
        'Company Name': row.company_name,
        'Date': formatDate(row.date),
        'Type': row.type,
        'Cash Amount (Tk)': row.cash_amount || 0,
        'Bonus Shares': row.bonus_quantity || 0
      }))
    } else {
      exportData = data.map(row => {
        const total = (row.quantity * row.price_per_unit) + (reportType === 'BUY' ? row.brokerage_fee : -row.brokerage_fee)
        return {
          'Stock': row.symbol,
          'Company Name': row.company_name,
          'Date': formatDate(row.date),
          'Type': row.type,
          'Quantity': row.quantity,
          'Price (Tk)': row.price_per_unit,
          'Fee (Tk)': row.brokerage_fee,
          'Total Value (Tk)': total
        }
      })
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(dataBlob, `${reportType.toLowerCase()}_report_${filterYear}_${filterStock}.xlsx`)
  }

  const currentTotal = useMemo(() => {
    return data.reduce((acc, row) => {
      if (reportType === 'DIVIDEND') {
        return acc + (row.cash_amount || 0)
      } else {
        const total = (row.quantity * row.price_per_unit)
        const fee = row.brokerage_fee || 0
        return acc + (reportType === 'BUY' ? total + fee : total - fee)
      }
    }, 0)
  }, [data, reportType])

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-120px)] space-y-3 px-4 sm:px-0">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
              {reportType === 'BUY' && (dict?.reports?.buyReport || 'Buy Report')}
              {reportType === 'SELL' && (dict?.reports?.sellReport || 'Sell Report')}
              {reportType === 'DIVIDEND' && (dict?.reports?.dividendReport || 'Dividend Report')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
              {reportType === 'BUY' && (dict?.reports?.buyDesc || 'Detailed log of all buys with export options.')}
              {reportType === 'SELL' && (dict?.reports?.sellDesc || 'Detailed log of all sells with export options.')}
              {reportType === 'DIVIDEND' && (dict?.reports?.dividendDesc || 'Detailed log of all dividends with export options.')}
            </p>
          </div>

          <div className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm flex flex-col transition-colors">
             <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 transition-colors">
               {dict?.reports?.filteredTotal || 'Filtered Total'}
             </span>
             <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 transition-colors">
               ৳{currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-200 dark:border-slate-800 rounded-2xl relative transition-colors flex-1 flex flex-col min-h-0">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-2xl flex flex-row flex-wrap justify-between items-center gap-3 relative z-30 transition-colors shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden sm:flex items-center justify-center w-8 h-8 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-gray-400 dark:text-gray-500 transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </div>
              
              <div className="w-[150px] sm:w-[170px]">
                <SearchableDropdown
                  options={stockOptions}
                  value={filterStock}
                  onChange={setFilterStock}
                  placeholder={dict?.reports?.allStocks || 'All Stocks'}
                  searchPlaceholder={dict?.reports?.searchStock || 'Search stock...'}
                  buttonClassName="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              <div className="w-[120px] sm:w-[130px]">
                <SearchableDropdown
                  options={yearOptions}
                  value={filterYear}
                  onChange={setFilterYear}
                  placeholder={dict?.reports?.allYears || 'All Years'}
                  searchPlaceholder={dict?.reports?.searchYear || 'Search year...'}
                  buttonClassName="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-xs font-medium min-h-[34px]"
                />
              </div>

              {(filterStock !== 'ALL' || filterYear !== 'ALL') && (
                <button 
                  onClick={() => {
                    setFilterStock('ALL')
                    setFilterYear('ALL')
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  {dict?.reports?.clear || 'Clear'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={data.length === 0 || isLoading}
                className="flex items-center px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {dict?.reports?.csv || 'CSV'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={data.length === 0 || isLoading}
                className="flex items-center px-3 py-1.5 text-xs font-bold text-white bg-green-600 dark:bg-green-700 border border-transparent rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {dict?.reports?.excel || 'Excel'}
              </button>
            </div>
          </div>
          
          <div className="relative flex-1 flex flex-col min-h-0">
            {isLoading && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-b-2xl transition-all duration-300">
                <div className="flex flex-col items-center bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-700">
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Loading records...</span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800 transition-colors relative">
                <thead className="bg-gray-100/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md transition-colors shadow-sm">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.stock || 'Stock'}</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.date || 'Date'}</th>
                    {reportType === 'DIVIDEND' ? (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.type || 'Type'}</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.cash || 'Cash (৳)'}</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.bonusShares || 'Bonus Shares'}</th>
                      </>
                    ) : (
                      <>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.quantity || 'Quantity'}</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.price || 'Price (৳)'}</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider hidden sm:table-cell">{dict?.table?.fee || 'Fee (৳)'}</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-extrabold text-black dark:text-white uppercase tracking-wider">{dict?.table?.total || 'Total (৳)'}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                  {data.length > 0 ? (
                    data.map((row) => {
                      if (reportType === 'DIVIDEND') {
                        return (
                          <tr key={row.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-xs font-bold text-gray-900 dark:text-white">{row.symbol}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] hidden md:block">{row.company_name}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {row.date ? formatDate(row.date) : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                                row.type === 'INTERIM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-green-600 dark:text-green-400 text-right font-medium">
                              {row.cash_amount ? `৳${row.cash_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-white text-right">
                              {row.bonus_quantity ? `+${row.bonus_quantity.toLocaleString()}` : '-'}
                            </td>
                          </tr>
                        )
                      } else {
                        const total = (row.quantity * row.price_per_unit) + (reportType === 'BUY' ? row.brokerage_fee : -row.brokerage_fee)
                        return (
                          <tr key={row.id} className="even:bg-gray-50/60 dark:even:bg-slate-800/40 odd:bg-white dark:odd:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-colors group">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-xs font-bold text-gray-900 dark:text-white">{row.symbol}</div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] hidden md:block">{row.company_name}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                              {row.date ? formatDate(row.date) : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right font-medium">
                              {row.quantity?.toLocaleString() ?? '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white text-right">
                              {row.price_per_unit?.toFixed(2) ?? '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">
                              {row.brokerage_fee?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-white text-right">
                              {total ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                            </td>
                          </tr>
                        )
                      }
                    })
                  ) : (
                    <tr>
                      <td colSpan={reportType === 'DIVIDEND' ? 5 : 6} className="px-6 py-12 text-center text-gray-500">
                        {isLoading ? '' : (dict?.reports?.noRecords || 'No records match your current filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50/50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-100 dark:border-slate-800 rounded-b-2xl flex items-center justify-end transition-colors shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {dict?.reports?.totalRecords || 'Total Records:'} <span className="text-gray-900 dark:text-white ml-1">{data.length}</span>
              </span>
            </div>
          </div>
        </div>
    </div>
  )
}
