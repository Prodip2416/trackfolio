'use client'

import { User } from '@supabase/supabase-js'
import { logout } from '@/app/auth/actions'
import { LogOut, ChevronRight } from 'lucide-react'

export default function Topbar({ user, title }: { user: User, title: string }) {
  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center text-sm font-medium">
        <span className="text-gray-400">TrackFolio</span>
        <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
        <span className="text-gray-900 font-bold">{title}</span>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-2">
            {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-gray-700 hidden sm:block">
            {user.user_metadata?.full_name || user.email}
          </span>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
      
    </div>
  )
}
