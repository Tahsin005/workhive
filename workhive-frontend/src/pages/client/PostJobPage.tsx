import { useNavigate, Link } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Briefcase, FileText, DollarSign, LayoutGrid } from "lucide-react"

import { useCreateJobMutation } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { postJobSchema, type PostJobFormValues } from "@/schemas/jobSchemas"

export default function PostJobPage() {
  const navigate = useNavigate()
  const [createJob, { isLoading }] = useCreateJobMutation()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      description: "",
      budget_min: "",
      budget_max: "",
      category: "",
    },
  })

  const onSubmit = async (values: PostJobFormValues) => {
    try {
      const payload = {
        ...values,
        budget_min: Number(values.budget_min),
        budget_max: Number(values.budget_max),
      }
      await createJob(payload).unwrap()
      toast.success("Job posted successfully!")
      navigate("/client/jobs/my")
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to post job. Please try again.")
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Post a Job</h1>
          <p className="text-muted-foreground">Fill out the details to find the perfect freelancer.</p>
        </div>
      </div>

      <Card className="border shadow-md">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            Job Details
          </CardTitle>
          <CardDescription>
            Provide clear and detailed information to attract the best talent.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form id="post-job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      disabled={isLoading}
                    />
                    <p className="text-[0.8rem] text-muted-foreground">A short, descriptive title helps freelancers understand what you need.</p>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="category"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="job-category" className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-gray-500" />
                      Category
                    </FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <SelectTrigger id="job-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Writing">Writing</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="budget_min"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="job-budget-min" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Minimum Budget ($)
                      </FieldLabel>
                      <Input 
                        {...field} 
                        id="job-budget-min" 
                        type="number" 
                        placeholder="50" 
                        disabled={isLoading}
                        value={field.value || ''}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

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
                        disabled={isLoading}
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
                      placeholder="Describe your project, required skills, and deliverables..." 
                      className="min-h-[200px]"
                      disabled={isLoading}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" form="post-job-form" className="w-full sm:w-auto mt-4" disabled={isLoading}>
              {isLoading ? "Posting Job..." : "Post Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
