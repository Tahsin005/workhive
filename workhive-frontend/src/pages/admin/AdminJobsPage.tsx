import { useState } from "react"
import { useGetJobsQuery, useDeleteJobMutation } from "@/store/api/adminApi"
import { Link } from "react-router"
import { Search, Eye, Trash2, LayoutGrid } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminJobsPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [category, setCategory] = useState<string>("all")

  // Query Hook
  const { data, isLoading, isFetching } = useGetJobsQuery({
    page,
    limit,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    category: category !== "all" ? category : undefined,
  })

  // Mutation Hook
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job? This action may be restricted if it has an active contract.")) return
    
    try {
      await deleteJob(id).unwrap()
      toast.success("Job successfully deleted.")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete job.")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'open': return 'default'
      case 'in_progress': return 'secondary'
      case 'completed': return 'outline'
      default: return 'outline'
    }
  }

  const jobs = data?.data || []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Jobs</h1>
          <p className="text-muted-foreground">Manage all jobs on the platform.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search titles or descriptions..."
            className="pl-8"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Web Development">Web Development</SelectItem>
            <SelectItem value="Mobile Development">Mobile Development</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Writing">Writing</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Detail</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bids</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No jobs found.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <div className="flex flex-col max-w-[250px]">
                      <span className="font-medium text-gray-900 truncate" title={j.title}>{j.title}</span>
                      <span className="text-xs text-muted-foreground">by {j.client.full_name}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(j.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      {j.category}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${j.budget_min} - ${j.budget_max}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(j.status)} className="capitalize">
                      {j.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{j.bid_count}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link to={`/admin/jobs/${j.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(j.id)}
                        disabled={isDeleting}
                        className="hover:text-red-600 hover:bg-red-50"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            disabled={page >= meta.total_pages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
