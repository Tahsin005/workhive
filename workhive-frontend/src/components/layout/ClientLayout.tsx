import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ClientSidebar from './sidebar/ClientSidebar'

export default function ClientLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex fixed inset-0 overflow-hidden bg-background">
      <ClientSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <Link to="/" className="text-xl font-bold text-primary">WorkHive</Link>
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
