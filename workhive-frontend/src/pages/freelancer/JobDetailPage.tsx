import { useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Loader2, DollarSign, Clock, Send, AlertCircle, LogIn, ShieldCheck } from "lucide-react"

import { useGetJobQuery, useSubmitBidMutation } from "@/store/api/jobsApi"
import { useGetMyBidsQuery } from "@/store/api/bidsApi"
import { useAuth } from "@/hooks/useAuth"
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
import { Separator } from "@/components/ui/separator"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { submitBidSchema, type SubmitBidFormValues } from "@/schemas/jobSchemas"

export default function FreelancerJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const { data: jobData, isLoading: isLoadingJob, isError } = useGetJobQuery(id!)
  const { data: bidsData, isLoading: isLoadingBids } = useGetMyBidsQuery({ job_id: id }, { skip: !isAuthenticated })
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
  const showBiddingForm = isAuthenticated && user?.role === 'freelancer' && job?.status === 'open' && !activeBid

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
          <Link to="/jobs">Return to Jobs</Link>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-none font-bold">{job.category}</Badge>
            <span className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {showBiddingForm && (
            <Card className="border-none shadow-sm ring-1 ring-gray-200 bg-primary/5" id="proposal-form">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Submit a Proposal
                </CardTitle>
                <CardDescription>
                  Propose your terms for this job. Make sure your cover letter stands out!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmitBid)} className="space-y-6">
                  <div className="grid gap-6">
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="space-y-2">
                          <label htmlFor="bid-amount" className="text-sm font-bold flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Bid Amount ($)
                          </label>
                          <Input 
                            {...field} 
                            id="bid-amount" 
                            type="number"
                            min="5"
                            className="h-11 border-gray-200"
                            placeholder={`e.g. ${(job.budget_min + job.budget_max) / 2}`} 
                            disabled={isSubmitting}
                          />
                          <p className="text-xs text-muted-foreground">
                            Client budget: ${job.budget_min} - ${job.budget_max}
                          </p>
                          {fieldState.invalid && <p className="text-xs text-destructive mt-1">{fieldState.error?.message}</p>}
                        </div>
                      )}
                    />

                    <Controller
                      name="cover_letter"
                      control={control}
                      render={({ field, fieldState }) => (
                        <div className="space-y-2">
                          <label htmlFor="bid-cover" className="text-sm font-bold">Cover Letter</label>
                          <Textarea 
                            {...field} 
                            id="bid-cover"
                            className="min-h-[200px] border-gray-200"
                            placeholder="Introduce yourself and explain why you're a great fit..."
                            disabled={isSubmitting}
                          />
                          {fieldState.invalid && <p className="text-xs text-destructive mt-1">{fieldState.error?.message}</p>}
                        </div>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto font-bold shadow-lg shadow-primary/20">
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
            <Card className="border-none shadow-sm ring-1 ring-gray-200 bg-indigo-50/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-xl">Your Proposal</CardTitle>
                  <Badge className="capitalize font-bold px-3">{activeBid.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1">Proposed Rate</p>
                    <p className="text-2xl font-black text-indigo-600">${activeBid.amount}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-1">Submitted On</p>
                    <p className="text-lg font-bold">{format(new Date(activeBid.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Your Pitch</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">"{activeBid.cover_letter}"</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 rounded-xl font-bold" asChild>
                    <Link to="/freelancer/bids/my">Manage Proposals</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">About Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {job.client?.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-gray-900">{job.client?.full_name}</p>
                  <div className="flex items-center text-xs text-green-600 font-bold">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verified Client
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Budget</p>
                <p className="text-xl font-black">${job.budget_min} - ${job.budget_max}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Status</p>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="capitalize px-3 font-bold">
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
