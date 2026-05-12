import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Calendar,
  Tag,
  Users,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"

import { useGetJobQuery, useGetJobBidsQuery, useDeleteJobMutation } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ClientJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: jobData, isLoading: isLoadingJob, isError } = useGetJobQuery(id!)
  const { data: bidsData, isLoading: isLoadingBids } = useGetJobBidsQuery(id!)
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()

  const job = jobData?.data
  const bids = bidsData?.data || []

  const pendingBids = bids.filter((b) => b.status === "pending").length
  const acceptedBids = bids.filter((b) => b.status === "accepted").length

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return
    try {
      await deleteJob(id!).unwrap()
      toast.success("Job deleted successfully.")
      navigate("/client/jobs/my")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete the job.")
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "open": return { variant: "default" as const, icon: <Clock className="mr-1 h-3 w-3" />, label: "Open" }
      case "in_progress": return { variant: "secondary" as const, icon: <CheckCircle2 className="mr-1 h-3 w-3" />, label: "In Progress" }
      case "completed": return { variant: "outline" as const, icon: <CheckCircle2 className="mr-1 h-3 w-3" />, label: "Completed" }
      case "cancelled": return { variant: "destructive" as const, icon: <XCircle className="mr-1 h-3 w-3" />, label: "Cancelled" }
      default: return { variant: "outline" as const, icon: null, label: s }
    }
  }

  if (isLoadingJob) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-destructive">Failed to load job. It may have been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/client/jobs/my">Return to My Jobs</Link>
        </Button>
      </div>
    )
  }

  const statusBadge = getStatusBadge(job.status)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/jobs/my">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{job.title}</h1>
              <Badge variant={statusBadge.variant} className="capitalize flex items-center">
                {statusBadge.icon}
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Posted {format(new Date(job.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {job.status === "open" && (
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link to={`/client/jobs/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Proposals</CardTitle>
                <CardDescription>
                  {isLoadingBids
                    ? "Loading..."
                    : `${bids.length} total — ${pendingBids} pending${acceptedBids > 0 ? `, ${acceptedBids} accepted` : ""}`}
                </CardDescription>
              </div>
              <Button asChild>
                <Link to={`/client/jobs/${id}/bids`}>
                  <Users className="mr-2 h-4 w-4" />
                  Review Proposals
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>

            {!isLoadingBids && bids.length > 0 && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900">{bids.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-amber-700">{pendingBids}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">{acceptedBids}</p>
                    <p className="text-xs text-muted-foreground mt-1">Accepted</p>
                  </div>
                </div>
              </CardContent>
            )}

            {!isLoadingBids && bids.length === 0 && (
              <CardContent className="pt-0 pb-6 text-center text-muted-foreground text-sm">
                No proposals yet. Freelancers will start bidding soon!
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Budget</p>
                  <p className="font-semibold text-gray-900">
                    ${job.budget_min?.toLocaleString()} – ${job.budget_max?.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Category</p>
                  <p className="font-semibold text-gray-900">{job.category}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Posted</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(job.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {job.updated_at !== job.created_at && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Last Updated</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(job.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-indigo-50 border-indigo-100">
            <CardContent className="pt-6 space-y-3">
              <Button asChild className="w-full" size="sm">
                <Link to={`/client/jobs/${id}/bids`}>
                  <Users className="mr-2 h-4 w-4" />
                  View All Proposals ({isLoadingBids ? "..." : bids.length})
                </Link>
              </Button>
              {job.status === "open" && (
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link to={`/client/jobs/${id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Job
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
