import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { User } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { getDictionary, Locale } from '@/i18n/getDictionary'

export default async function AppLayout({ 
  children, 
  user, 
  title 
}: { 
  children: React.ReactNode
  user: User
  title: string 
}) {
  let lastSyncTime = null
  try {
    const lastCompany = await prisma.dse_companies.findFirst({
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true }
    })
    lastSyncTime = lastCompany?.updated_at?.toISOString() || null
  } catch (e) {
    console.error(e)
  }

  const dict = await getDictionary()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar dict={dict} user={user} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} title={title} lastSyncTime={lastSyncTime} dict={dict} />
        
        <main className="flex-grow pt-[10px] pb-5 pl-[15px] pr-[10px]">
          {children}
        </main>
      </div>
    </div>
  )
}
