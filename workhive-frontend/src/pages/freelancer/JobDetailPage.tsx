import { useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Loader2, DollarSign, Clock, Send, AlertCircle } from "lucide-react"

import { useGetJobQuery, useSubmitBidMutation } from "@/store/api/jobsApi"
import { useGetMyBidsQuery } from "@/store/api/bidsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { submitBidSchema, type SubmitBidFormValues } from "@/schemas/jobSchemas"

export default function FreelancerJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data: jobData, isLoading: isLoadingJob, isError } = useGetJobQuery(id!)
  const { data: bidsData, isLoading: isLoadingBids } = useGetMyBidsQuery({ job_id: id })
  const [submitBid, { isLoading: isSubmitting }] = useSubmitBidMutation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SubmitBidFormValues>({
    resolver: zodResolver(submitBidSchema),
    defaultValues: {
      amount: "",
      cover_letter: "",
    },
  })

  const job = jobData?.data
  const activeBid = bidsData?.data?.find(bid => bid.job_id === id && (bid.status === 'pending' || bid.status === 'accepted'))
  const previousBid = bidsData?.data?.find(bid => bid.job_id === id)
  
  useEffect(() => {
    if (previousBid && !activeBid) {
      reset({
        amount: String(previousBid.amount),
        cover_letter: previousBid.cover_letter,
      })
    }
  }, [previousBid, activeBid, reset])

  const existingBid = activeBid || previousBid
  const showBiddingForm = job?.status === 'open' && !activeBid

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
        <p className="text-destructive">Failed to load job details. The job might have been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/freelancer/jobs">Return to Jobs</Link>
        </Button>
      </div>
    )
  }


  const onSubmitBid = async (values: SubmitBidFormValues) => {
    try {
      const payload = {
        amount: Number(values.amount),
        cover_letter: values.cover_letter,
      }
      await submitBid({ id: job.id, data: payload }).unwrap()
      toast.success("Proposal submitted successfully!")
      reset()
      navigate("/freelancer/bids/my")
    } catch (error: any) {
      if (error.status === 409) {
        toast.error("You already have an active proposal for this job.")
      } else {
        toast.error(error.data?.message || "Failed to submit proposal. Please try again.")
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/freelancer/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <Badge variant="secondary" className="font-normal">{job.category}</Badge>
            <span className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle className="text-xl">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {showBiddingForm && (
            <Card className="border shadow-sm border-indigo-100" id="proposal-form">
              {previousBid && !activeBid && (
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>You previously submitted a proposal that was {previousBid.status}. You can submit a new one below.</span>
                </div>
              )}
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
                  <Send className="h-5 w-5 text-indigo-600" />
                  Submit a Proposal
                </CardTitle>
                <CardDescription>
                  Propose your terms for this job. Make sure your cover letter stands out!
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmitBid)} className="space-y-6">
                  <FieldGroup>
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="bid-amount" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            Bid Amount ($)
                          </FieldLabel>
                          <Input 
                            {...field} 
                            id="bid-amount" 
                            type="number"
                            min="5"
                            placeholder={`e.g. ${(job.budget_min + job.budget_max) / 2}`} 
                            disabled={isSubmitting}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Client budget: ${job.budget_min} - ${job.budget_max}
                          </p>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="cover_letter"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="bid-cover">Cover Letter</FieldLabel>
                          <Textarea 
                            {...field} 
                            id="bid-cover"
                            className="min-h-[200px]"
                            placeholder="Introduce yourself, explain why you are a great fit for this job, and detail your approach..."
                            disabled={isSubmitting}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Proposal"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeBid && (
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
                  <Badge variant={activeBid.status === 'pending' ? 'secondary' : activeBid.status === 'accepted' ? 'default' : 'destructive'} className="h-2 w-2 rounded-full p-0 mr-1" />
                  Your Proposal Status: <span className="capitalize">{activeBid.status}</span>
                </CardTitle>
                <CardDescription>You have already submitted a proposal for this job.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Your Proposed Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">${activeBid.amount}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Submitted On</p>
                    <p className="text-lg font-semibold">{format(new Date(activeBid.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Your Pitch</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{activeBid.cover_letter}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to="/freelancer/bids/my">
                      Manage All Proposals
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" disabled>
                    Withdraw Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {job.status !== 'open' && (
            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-6 text-center text-amber-800">
                <h3 className="font-semibold text-lg mb-1">Job is not open for bidding</h3>
                <p>This job is currently marked as "{job.status.replace('_', ' ')}". You cannot submit a proposal at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">About the Client</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                  {job.client?.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{job.client?.full_name}</p>
                  <p className="text-sm text-muted-foreground">Client</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Client Budget
                </p>
                <p className="font-semibold mt-1">${job.budget_min} - ${job.budget_max}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="capitalize mt-1">
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
