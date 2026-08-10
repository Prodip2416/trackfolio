import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center space-y-4 transform transition-all">
        <div className="relative">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-gray-900 font-extrabold text-xl tracking-tight">TrackFolio</p>
          <p className="text-gray-500 text-sm font-medium">Preparing your portfolio...</p>
        </div>
      </div>
    </div>
  )
}
