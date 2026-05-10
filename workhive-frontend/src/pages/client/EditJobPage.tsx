import { useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Pencil, FileText, DollarSign, Loader2 } from "lucide-react"

import { useGetJobQuery, useUpdateJobMutation } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"

const editJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget_max: z.string().min(1, "Maximum budget is required"),
}).refine((data) => {
  const max = Number(data.budget_max);
  if (isNaN(max)) return false;
  return max >= 5;
}, {
  message: "Budget must be at least $5",
  path: ["budget_max"],
})

type EditJobFormValues = z.infer<typeof editJobSchema>

export default function EditJobPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const { data: jobData, isLoading: isLoadingJob, isError } = useGetJobQuery(id!)
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditJobFormValues>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      title: "",
      description: "",
      budget_max: "",
    },
  })

  const job = jobData?.data

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        budget_max: job.budget_max.toString(),
      })
    }
  }, [job, reset])

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
        <p className="text-destructive">Failed to load job details. It might have been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/client/jobs/my">Return to My Jobs</Link>
        </Button>
      </div>
    )
  }

  if (job.status !== 'open') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Cannot Edit Job</h2>
        <p className="text-muted-foreground">This job is marked as "{job.status.replace('_', ' ')}" and can no longer be edited.</p>
        <Button asChild>
          <Link to="/client/jobs/my">Return to My Jobs</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = async (values: EditJobFormValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        budget_max: Number(values.budget_max),
      }
      await updateJob({ id: job.id, data: payload }).unwrap()
      toast.success("Job updated successfully!")
      navigate("/client/jobs/my")
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to update job.")
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client/jobs/my">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Edit Job</h1>
          <p className="text-muted-foreground">Update the details of your job posting.</p>
        </div>
      </div>

      <Card className="border shadow-md">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Pencil className="h-5 w-5 text-indigo-500" />
            Job Details
          </CardTitle>
          <CardDescription>
            You can update the title, description, and maximum budget for open jobs. Minimum budget and category cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form id="edit-job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="job-title" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Job Title
                    </FieldLabel>
                    <Input 
                      {...field} 
                      id="job-title" 
                      placeholder="e.g. Build a responsive React application" 
                      disabled={isUpdating}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FieldLabel className="text-muted-foreground mb-1 block">Minimum Budget ($)</FieldLabel>
                  <Input disabled value={job.budget_min} className="bg-muted" />
                  <p className="text-[0.8rem] text-muted-foreground mt-1">Cannot be changed.</p>
                </div>

                <Controller
                  name="budget_max"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="job-budget-max" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Maximum Budget ($)
                      </FieldLabel>
                      <Input 
                        {...field} 
                        id="job-budget-max" 
                        type="number" 
                        placeholder="500" 
                        disabled={isUpdating}
                        value={field.value || ''}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="job-description">Job Description</FieldLabel>
                    <Textarea 
                      {...field} 
                      id="job-description"
                      className="min-h-[200px]"
                      disabled={isUpdating}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className="flex gap-4 pt-4">
              <Button type="submit" form="edit-job-form" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isUpdating}>
                <Link to="/client/jobs/my">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
