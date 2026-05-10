import { useState, useEffect } from "react"
import { Link } from "react-router"
import { format } from "date-fns"
import { 
  Briefcase, 
  Search,
  Filter,
  DollarSign,
  Clock,
  User as UserIcon,
  Loader2,
  ChevronRight
} from "lucide-react"

import { useGetJobsQuery } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function JobsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // Reset page on new search
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])
  
  const limit = 10
  const { data, isLoading, isError, isFetching } = useGetJobsQuery({ 
    page, 
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {})
  })

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'open': return 'default'
      case 'in_progress': return 'secondary'
      case 'completed': return 'outline'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-destructive">Failed to load jobs.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const jobs = data?.data || []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Find Work</h1>
          <p className="text-muted-foreground">Discover opportunities and submit proposals.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for jobs..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-xl mb-2">No jobs found</CardTitle>
          <CardDescription className="max-w-sm">
            There are currently no open jobs matching your criteria. Please check back later.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className={`overflow-hidden transition-all hover:shadow-md hover:border-indigo-200 group ${isFetching ? 'opacity-50' : ''}`}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="space-y-1 flex-1">
                      <Link to={`/freelancer/jobs/${job.id}`} className="group-hover:text-indigo-600 transition-colors">
                        <h2 className="text-xl font-bold">{job.title}</h2>
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="font-normal">{job.category}</Badge>
                        <span className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {format(new Date(job.created_at), 'MMM d, yyyy')}
                        </span>
                        {job.client && (
                          <span className="flex items-center">
                            <UserIcon className="h-3.5 w-3.5 mr-1" />
                            {job.client.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="text-lg font-bold text-gray-900 flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {job.budget_min} - {job.budget_max}
                      </div>
                      <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-4">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {job.status === 'open' ? 'Accepting Proposals' : 'Closed for Bidding'}
                    </div>
                    <Button asChild variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600 text-sm group/btn">
                      <Link to={`/freelancer/jobs/${job.id}`}>
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {meta && meta.total_pages > 1 && (
            <Pagination className="mt-8 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {page} of {meta.total_pages}
                </span>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
                    className={page === meta.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}
