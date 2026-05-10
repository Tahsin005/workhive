import { useParams, Link, useNavigate } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Loader2, DollarSign, Clock, Send } from "lucide-react"

import { useGetJobQuery, useSubmitBidMutation } from "@/store/api/jobsApi"
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

          {job.status === 'open' && (
            <Card className="border shadow-sm border-indigo-100" id="proposal-form">
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
