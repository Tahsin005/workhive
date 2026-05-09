import { Button } from "./ui/button"
import { Hexagon } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-full px-6 py-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-inner">
            <Hexagon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">WorkHive</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Find Work</a>
          <a href="#" className="hover:text-primary transition-colors">Post a Job</a>
          <a href="#" className="hover:text-primary transition-colors">Solutions</a>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full">Sign In</Button>
          <Button className="rounded-full px-6">Join the Hive</Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
