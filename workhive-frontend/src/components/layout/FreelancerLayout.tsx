import { useState } from 'react'
import { Outlet } from 'react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FreelancerSidebar from './sidebar/FreelancerSidebar'

export default function FreelancerLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex fixed inset-0 overflow-hidden bg-background">
      <FreelancerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header for hamburger menu */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <h1 className="text-xl font-bold text-primary">WorkHive</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
