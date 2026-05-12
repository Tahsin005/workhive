import { useState } from "react"
import { Link } from "react-router"
import { format } from "date-fns"
import { 
  Briefcase, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Users, 
  Eye,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

import { useGetMyJobsQuery, useDeleteJobMutation } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function MyJobsPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError, isFetching } = useGetMyJobsQuery({ page, limit })
  const [deleteJob] = useDeleteJobMutation()

  const handleDelete = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone unless there are active contracts.")) return
    try {
      await deleteJob(jobId).unwrap()
      toast.success("Job deleted successfully")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete job")
    }
  }

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
        <p className="text-destructive">Failed to load your jobs.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const jobs = data?.data || []
  const pagination = (data as any)?.pagination
  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || limit)) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground">Manage your posted jobs and review bids.</p>
        </div>
        <Button asChild>
          <Link to="/client/jobs/post">
            <Plus className="mr-2 h-4 w-4" />
            Post a Job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-xl mb-2">No jobs posted yet</CardTitle>
          <CardDescription className="mb-6 max-w-sm">
            You haven't posted any jobs. Create your first job posting to start receiving bids from freelancers.
          </CardDescription>
          <Button asChild>
            <Link to="/client/jobs/post">Post a Job</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className={`overflow-hidden transition-all hover:shadow-md ${isFetching ? 'opacity-50' : ''}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center p-6 gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/client/jobs/${job.id}`} className="font-semibold text-lg hover:underline">
                        {job.title}
                      </Link>
                      <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center">
                        <span className="font-medium text-foreground mr-1">Budget:</span> 
                        ${job.budget_min} - ${job.budget_max}
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium text-foreground mr-1">Posted:</span> 
                        {format(new Date(job.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/client/jobs/${job.id}/bids`}>
                        <Users className="mr-2 h-4 w-4" />
                        View Bids
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/client/jobs/${job.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {job.status === 'open' && (
                          <DropdownMenuItem asChild>
                            <Link to={`/client/jobs/${job.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {pagination && totalPages > 1 && (
            <Pagination className="mt-8 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
