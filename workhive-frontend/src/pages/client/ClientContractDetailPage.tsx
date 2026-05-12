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
  Trophy,
  Star
} from "lucide-react"

import { 
  useGetContractQuery, 
  useCancelContractMutation, 
  useCompleteContractMutation,
  useDisputeContractMutation
} from "@/store/api/contractsApi"
import { useGetPaymentByContractQuery } from "@/store/api/paymentsApi"
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

export default function ClientContractDetailPage() {
  const { id } = useParams()
  const [showReviewForm, setShowReviewForm] = useState(false)
  
  const { data: response, isLoading, isError } = useGetContractQuery(id!)
  const { data: paymentResponse, isLoading: isLoadingPayment } = useGetPaymentByContractQuery(id!)
  const [cancelContract, { isLoading: isCancelling }] = useCancelContractMutation()
  const [completeContract, { isLoading: isCompleting }] = useCompleteContractMutation()
  const [disputeContract, { isLoading: isDisputing }] = useDisputeContractMutation()

  const contract = response?.data
  const payments = paymentResponse?.data
  const isPaid = Array.isArray(payments) ? payments.some(p => p.status === 'paid') : false

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this contract? This action will set the job status back to open.")) return
    
    try {
      await cancelContract(id!).unwrap()
      toast.success("Contract cancelled successfully")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to cancel contract")
    }
  }

  const handleDispute = async () => {
    if (!window.confirm("Are you sure you want to raise a dispute? An admin will review the case and resolve it.")) return
    
    try {
      await disputeContract(id!).unwrap()
      toast.success("Dispute raised successfully. An admin will contact you soon.")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to raise dispute")
    }
  }

  const handleComplete = async () => {
    if (!isPaid) {
      toast.error("You must fund the contract before completing it.")
      return
    }

    if (!window.confirm("Are you sure you want to mark this contract as completed? Make sure the work has been delivered.")) return
    
    try {
      await completeContract(id!).unwrap()
      toast.success("Contract completed successfully!")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to complete contract")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex gap-2">
            <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="mr-1 h-3 w-3" /> Active</Badge>
            {isPaid ? (
              <Badge className="bg-green-600"><DollarSign className="mr-1 h-3 w-3" /> Funded</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-600"><DollarSign className="mr-1 h-3 w-3" /> Awaiting Funding</Badge>
            )}
          </div>
        )
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Cancelled</Badge>
      case 'disputed':
        return <Badge className="bg-red-600"><AlertCircle className="mr-1 h-3 w-3" /> Disputed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading || isLoadingPayment) {
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
          <Link to="/client/contracts">Back to Contracts</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/client/contracts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contract Management</h1>
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
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Active Project Workroom
                </CardTitle>
                <CardDescription>
                  Review the freelancer's work and communicate progress.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {!isPaid && (
                  <Alert className="mb-6 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Payment Required</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Please fund this contract to enable final completion and release funds. 
                      Your payment will be held securely in escrow.
                    </AlertDescription>
                  </Alert>
                )}
                <ChatBox contractId={id!} />
              </CardContent>
            </Card>
          )}

          {contract.status === 'disputed' && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Contract in Dispute
                </CardTitle>
                <CardDescription className="text-red-600">
                  This project has been flagged for dispute. An admin is currently reviewing the case and will mediate between both parties.
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
                <Trophy className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-800">Project Successfully Completed!</AlertTitle>
                <AlertDescription className="text-green-700">
                  This project was completed on {contract.completed_at ? format(new Date(contract.completed_at), 'MMM d, yyyy') : 'N/A'}. 
                  You can now leave a review for the freelancer.
                </AlertDescription>
              </Alert>

              {showReviewForm ? (
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Leave a Review</CardTitle>
                    <CardDescription>Share your experience with {contract.freelancer?.full_name}</CardDescription>
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
                  Leave a Review for Freelancer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Freelancer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {contract.freelancer?.avatar_url ? (
                    <img src={contract.freelancer.avatar_url} alt={contract.freelancer.full_name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{contract.freelancer?.full_name}</p>
                  <Link to={`/profile/${contract.freelancer?.id}`} className="text-xs text-primary hover:underline">View Profile</Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract.status === 'active' && (
                <>
                  {!isPaid ? (
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" 
                      asChild
                    >
                      <Link to={`/client/contracts/${contract.id}/pay`}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Fund Project Now
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 h-11" 
                      onClick={handleComplete}
                      disabled={isCompleting}
                    >
                      {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Complete Project
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Cancel Contract
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDispute}
                    disabled={isDisputing}
                  >
                    {isDisputing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                    Raise Dispute
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/client/jobs/${contract.job?.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Original Job Post
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
