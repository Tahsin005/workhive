import { Link } from "react-router"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
