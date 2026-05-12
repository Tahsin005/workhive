import { Link, NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, PlusCircle, Briefcase, FileText, CreditCard, User, LogOut } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { clearAuth } from '@/store/slices/authSlice'
import { authApi } from '@/store/api/authApi'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function ClientSidebar({
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
    { to: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/client/jobs/post', label: 'Post a Job', icon: PlusCircle },
    { to: '/client/jobs/my', label: 'My Jobs', icon: Briefcase },
    { to: '/client/contracts', label: 'Contracts', icon: FileText },
    { to: '/client/payments', label: 'Payments', icon: CreditCard },
    { to: '/client/profile', label: 'Profile', icon: User },
  ]

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b">
        <Link to="/" className="text-2xl font-bold tracking-tight text-primary">WorkHive</Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={user?.avatar_url || undefined} />
            <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <Badge variant="default" className="text-xs">
              {user?.role}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
}
