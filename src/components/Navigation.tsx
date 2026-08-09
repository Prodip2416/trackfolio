import { logout } from '@/app/auth/actions'
import { LogOut, LayoutDashboard, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

export default function Navigation({ user }: { user: User }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">TrackFolio</h1>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link 
                href="/transactions" 
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Trade Log
              </Link>
              <Link 
                href="/history" 
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                History
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user.user_metadata?.full_name || user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
