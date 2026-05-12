import { Link, NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, Users, Briefcase, LogOut } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { clearAuth } from '@/store/slices/authSlice'
import { authApi } from '@/store/api/authApi'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(clearAuth())
    dispatch(authApi.util.resetApiState())
    navigate('/login')
  }

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="text-2xl font-bold tracking-tight text-white">WorkHive Admin</Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin'}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <Badge variant="destructive" className="text-xs">
              {user?.role}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
}
