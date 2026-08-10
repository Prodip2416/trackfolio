'use client'

import { AlertTriangle, X, Loader2 } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onClose
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isLoading && onClose()}
      />
      
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start">
          <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
            isDestructive ? 'bg-red-100' : 'bg-indigo-100'
          }`}>
            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-indigo-600'}`} />
          </div>
          <div className="ml-4 mt-0 text-left">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            disabled={isLoading}
            className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm sm:w-auto disabled:opacity-50 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600' 
                : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-600'
            }`}
            onClick={onConfirm}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
