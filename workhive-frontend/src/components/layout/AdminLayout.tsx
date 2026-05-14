import { useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminSidebar from './sidebar/AdminSidebar'

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex fixed inset-0 overflow-hidden bg-background">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-gray-900 border-gray-800">
          <Link to="/" className="text-xl font-bold text-white">WorkHive Admin</Link>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-white hover:bg-gray-800 hover:text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
