import { useParams, useNavigate, Link } from "react-router"
import { useGetJobQuery, useDeleteJobMutation } from "@/store/api/adminApi"
import { useGetContractsQuery, useResolveDisputeMutation } from "@/store/api/contractsApi"
import { ArrowLeft, Trash2, LayoutGrid, DollarSign, Calendar, User, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AdminJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useGetJobQuery(id!)
  const { data: contractData, isLoading: isLoadingContract } = useGetContractsQuery({ job_id: id })
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation()
  const [resolveDispute, { isLoading: isResolving }] = useResolveDisputeMutation()

  if (isLoading || isLoadingContract) {
    return <div className="text-muted-foreground p-6">Loading job details...</div>
  }

  if (isError || !data?.data) {
    return <div className="text-red-500 p-6">Failed to load job details. It might have been deleted.</div>
  }

  const job = data.data
  const contract = contractData?.data && contractData.data.length > 0 ? contractData.data[0] : null

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

  const handleResolve = async (resolution: 'complete' | 'cancel') => {
    if (!contract) return
    const message = resolution === 'complete' 
      ? "Are you sure you want to resolve this dispute as COMPLETED? This will release funds to the freelancer."
      : "Are you sure you want to resolve this dispute as CANCELLED? This will return the job to open status."
    
    if (!window.confirm(message)) return

    try {
      await resolveDispute({ id: contract.id, resolution }).unwrap()
      toast.success(`Dispute resolved as ${resolution} successfully.`)
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to resolve dispute.")
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

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500"><Clock className="mr-1 h-3 w-3" /> Active</Badge>
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>
      case 'disputed':
        return <Badge className="bg-red-600"><AlertCircle className="mr-1 h-3 w-3" /> Disputed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 pb-12">
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
        <div className="md:col-span-2 space-y-6">
          <Card>
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
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {job.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {contract && (
            <Card className={contract.status === 'disputed' ? "border-red-200 shadow-md" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Contract Details</CardTitle>
                    <CardDescription>Associated contract for this job</CardDescription>
                  </div>
                  {getContractStatusBadge(contract.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Freelancer</p>
                      <p className="font-medium">{contract.freelancer?.full_name}</p>
                      <Link to={`/admin/users/${contract.freelancer?.id}`} className="text-[10px] text-blue-600 hover:underline">View Profile</Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Contract Amount</p>
                      <p className="font-bold text-lg">${contract.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {contract.status === 'disputed' && (
                  <>
                    <Separator />
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-900">Dispute Resolution Required</p>
                          <p className="text-sm text-red-700 leading-relaxed">
                            This contract is currently in dispute. As an administrator, you must review the case and resolve it.
                            Resolving as "Completed" will release funds, while "Cancelled" will return the job to open status.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700" 
                          onClick={() => handleResolve('complete')}
                          disabled={isResolving}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Resolve as Completed
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleResolve('cancel')}
                          disabled={isResolving}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Resolve as Cancelled
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

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
