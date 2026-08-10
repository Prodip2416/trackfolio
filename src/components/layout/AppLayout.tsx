import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { User } from '@supabase/supabase-js'

export default function AppLayout({ 
  children, 
  user, 
  title 
}: { 
  children: React.ReactNode
  user: User
  title: string 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} title={title} />
        
        <main className="flex-grow pt-[10px] pb-5 pl-[15px] pr-[10px]">
          {children}
        </main>
      </div>
    </div>
  )
}
