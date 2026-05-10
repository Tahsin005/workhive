import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-3xl px-4 text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
          Welcome to WorkHive
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with top freelancers and clients. Build your dream projects together with ease and confidence.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button size="lg" className="w-full sm:w-auto" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
