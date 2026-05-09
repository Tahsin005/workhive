import { LoginForm } from '../components/auth/LoginForm'
import { Hexagon } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-dot-pattern">
      <div className="flex items-center gap-2 mb-8 animate-float">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Hexagon className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight">WorkHive</span>
      </div>
      <LoginForm />
    </div>
  )
}
