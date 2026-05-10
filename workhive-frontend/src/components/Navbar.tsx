import { Button } from "./ui/button"
import { Hexagon, LogOut } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { useDispatch } from "react-redux"
import { clearAuth } from "../store/slices/authSlice"
import { authApi } from "../store/api/authApi"
import { useNavigate, Link } from "react-router"
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

  const handleLogout = () => {
    dispatch(clearAuth())
    dispatch(authApi.util.resetApiState())
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600'
      case 'client':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'freelancer':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-muted'
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-lg px-6 py-3 shadow-lg">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-inner">
            <Hexagon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">WorkHive</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/find-work" className="hover:text-primary transition-colors">Find Work</Link>
          <Link to="/post-job" className="hover:text-primary transition-colors">Post a Job</Link>
          <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
          <Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
        </div>
        
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold">{user.full_name}</span>
                <Badge variant="secondary" className={`${getRoleBadgeColor(user.role)} text-white border-none text-[10px] h-4`}>
                  {user.role}
                </Badge>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url || ''} alt={user.full_name} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="hidden sm:inline-flex rounded-full"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                className="rounded-full px-6"
                onClick={() => navigate('/register')}
              >
                Join the Hive
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
