import { useParams, useNavigate, Link } from "react-router"
import { useGetJobQuery, useDeleteJobMutation } from "@/store/api/adminApi"
import { ArrowLeft, Trash2, LayoutGrid, DollarSign, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useGetJobQuery(id!)
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()

  if (isLoading) {
    return <div className="text-muted-foreground p-6">Loading job details...</div>
  }

  if (isError || !data?.data) {
    return <div className="text-red-500 p-6">Failed to load job details. It might have been deleted.</div>
  }

  const job = data.data

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this job? This action may be restricted if it has an active contract.")) return
    
    try {
      await deleteJob(job.id).unwrap()
      toast.success("Job successfully deleted.")
      navigate("/admin/jobs")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete job.")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Job Details</h1>
            <p className="text-muted-foreground">Manage and review job posting.</p>
          </div>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Job
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">
                    {job.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center">
                    <LayoutGrid className="mr-1 h-3 w-3" /> {job.category}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {job.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget Range</p>
                  <p className="font-semibold">${job.budget_min} - ${job.budget_max}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Posted On</p>
                  <p className="font-semibold">{format(new Date(job.created_at), 'PPP')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {job.client.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{job.client.full_name}</p>
                  <Link to={`/admin/users/${job.client.id}`} className="text-sm text-blue-600 hover:underline">
                    View Profile
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
