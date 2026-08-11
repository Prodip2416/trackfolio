import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Risk & Fees - TrackFolio',
}

export default async function RiskAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <AppLayout user={user} title="Risk & Fees">
      <div className="w-full">
        <div className="px-4 py-4 sm:px-0">
          <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Risk & Fees Coming Soon</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We are currently building analysis tools for Brokerage Fee Impact, Average Cost comparisons, and Single Stock Exposure warnings.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
