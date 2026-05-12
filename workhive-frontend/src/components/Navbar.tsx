import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Hexagon, LogOut, Menu, X, Briefcase, LayoutDashboard, FileText, Users, Shield, Wallet } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useDispatch } from "react-redux"
import { clearAuth } from "../store/slices/authSlice"
import { authApi } from "../store/api/authApi"
import { useNavigate, Link, useLocation } from "react-router"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar"
import { Badge } from "./ui/badge"

const Navbar = () => {
  const { user, isAuthenticated } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    dispatch(clearAuth())
    dispatch(authApi.util.resetApiState())
    navigate('/login')
  }

  const getInitials = (name?: string) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return '??'
    return parts
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 hover:bg-red-600'
      case 'client': return 'bg-blue-500 hover:bg-blue-600'
      case 'freelancer': return 'bg-green-500 hover:bg-green-600'
      default: return 'bg-muted'
    }
  }

  const getLogoLink = () => {
    if (!isAuthenticated || !user) return '/'
    switch (user.role) {
      case 'admin': return '/admin'
      case 'client': return '/'
      case 'freelancer': return '/'
      default: return '/'
    }
  }

  const navLinks = {
    guest: [
      { label: 'Browse Jobs', href: '/jobs', icon: Briefcase },
      { label: 'How it Works', href: '#how-it-works', icon: FileText },
    ],
    freelancer: [
      { label: 'Dashboard', href: '/freelancer/dashboard', icon: LayoutDashboard },
      { label: 'Find Work', href: '/freelancer/jobs', icon: Briefcase },
      { label: 'My Proposals', href: '/freelancer/bids/my', icon: FileText },
      { label: 'My Contracts', href: '/freelancer/contracts', icon: Shield },
    ],
    client: [
      { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
      { label: 'My Jobs', href: '/client/jobs/my', icon: Briefcase },
      { label: 'Post a Job', href: '/client/jobs/post', icon: FileText },
      { label: 'Contracts', href: '/client/contracts', icon: Shield },
      { label: 'Payments', href: '/client/payments', icon: Wallet },
    ],
    admin: [
      { label: 'Admin Panel', href: '/admin', icon: Shield },
      { label: 'User Directory', href: '/admin/users', icon: Users },
      { label: 'Job Records', href: '/admin/jobs', icon: Briefcase },
    ]
  }

  const activeLinks = isAuthenticated && user 
    ? navLinks[user.role as keyof typeof navLinks] || []
    : navLinks.guest

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto relative">
        <div className="glass rounded-2xl px-4 md:px-6 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] flex items-center justify-between border border-white/40">
          {/* Logo */}
          <Link to={getLogoLink()} className="flex items-center gap-2 group transition-transform hover:scale-105">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Hexagon className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-gray-900">WORKHIVE</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {activeLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href} 
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-primary/5 hover:text-primary ${
                  location.pathname === link.href ? 'bg-primary/10 text-primary' : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 pl-2 border-l border-gray-100">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-tighter">{user.full_name}</span>
                    <Badge className={`${getRoleBadgeColor(user.role)} text-[9px] h-4 min-w-[60px] flex justify-center border-none shadow-sm font-bold uppercase`}>
                      {user.role}
                    </Badge>
                  </div>
                  <Link to={`/profile/${user.id}`}>
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-all p-0.5 cursor-pointer shadow-sm">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name} className="rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex rounded-xl font-bold text-gray-600"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button 
                  className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20"
                  onClick={() => navigate('/register')}
                >
                  Join Hive
                </Button>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden rounded-xl"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="premium-glass rounded-[2rem] p-6 shadow-2xl border border-white/50 space-y-6">
              <div className="grid gap-2">
                {activeLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    to={link.href} 
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      location.pathname === link.href 
                        ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' 
                        : 'hover:bg-primary/5 text-gray-700 font-bold'
                    }`}
                  >
                    <link.icon className={`h-5 w-5 ${location.pathname === link.href ? '' : 'text-primary'}`} />
                    {link.label}
                  </Link>
                ))}
              </div>

              {isAuthenticated && (
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 rounded-2xl h-12 font-bold text-red-500 border-red-50 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
