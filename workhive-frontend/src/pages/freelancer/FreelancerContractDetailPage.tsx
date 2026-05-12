import { useState } from "react"
import { useParams, Link } from "react-router"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  User,
  AlertCircle,
  Star
} from "lucide-react"

import { useGetContractQuery, useCancelContractMutation } from "@/store/api/contractsApi"
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
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert"
import { ReviewForm } from "@/components/ReviewForm"
import { ChatBox } from "@/components/ChatBox"

export default function FreelancerContractDetailPage() {
  const { id } = useParams()
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  const { data: response, isLoading, isError } = useGetContractQuery(id!)
  const [cancelContract, { isLoading: isCancelling }] = useCancelContractMutation()

  const contract = response?.data

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this contract? This action will set the job status back to open.")) return
    
    try {
      await cancelContract(id!).unwrap()
      toast.success("Contract cancelled successfully")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to cancel contract")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="mr-1 h-3 w-3" /> Active</Badge>
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !contract) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load contract details. It may not exist or you might not have permission to view it.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/freelancer/contracts">Back to Contracts</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/freelancer/contracts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contract Workroom</h1>
            <p className="text-muted-foreground text-sm">ID: {contract.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(contract.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{contract.job?.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Job Category: {contract.job?.category}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Job Description</h4>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {contract.job?.description || "No description available."}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contract Amount</p>
                    <p className="font-semibold">${contract.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Started On</p>
                    <p className="font-semibold">{format(new Date(contract.started_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {contract.status === 'active' && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Project Workroom
                </CardTitle>
                <CardDescription>
                  Communicate with the client and manage your deliverables here.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChatBox contractId={id!} />
              </CardContent>
            </Card>
          )}

          {contract.status === 'completed' && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-800">Contract Completed</AlertTitle>
                <AlertDescription className="text-green-700">
                  This contract was marked as completed on {contract.completed_at ? format(new Date(contract.completed_at), 'MMM d, yyyy') : 'N/A'}.
                  You can now leave a review for the client.
                </AlertDescription>
              </Alert>

              {showReviewForm ? (
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Leave a Review</CardTitle>
                    <CardDescription>Share your experience with {contract.client?.full_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReviewForm 
                      contractId={id!} 
                      onSuccess={() => setShowReviewForm(false)} 
                    />
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2" 
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button 
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 shadow-md"
                  onClick={() => setShowReviewForm(true)}
                >
                  <Star className="mr-2 h-5 w-5 fill-white" />
                  Leave a Review for Client
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {contract.client?.avatar_url ? (
                    <img src={contract.client.avatar_url} alt={contract.client.full_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{contract.client?.full_name}</p>
                  <Link to={`/profile/${contract.client?.id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract.status === 'active' && (
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Cancel Contract
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/freelancer/jobs/${contract.job?.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Original Job
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
