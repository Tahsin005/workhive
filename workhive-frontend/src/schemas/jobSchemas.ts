import { z } from "zod"

export const postJobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget_min: z.string().min(1, "Minimum budget is required"),
  budget_max: z.string().min(1, "Maximum budget is required"),
  category: z.string().min(1, "Please select a category"),
}).refine((data) => {
  const min = Number(data.budget_min);
  const max = Number(data.budget_max);
  if (isNaN(min) || isNaN(max)) return false;
  return min >= 5 && max >= 5 && max >= min;
}, {
  message: "Invalid budget range or values less than $5",
  path: ["budget_max"],
})

export type PostJobFormValues = z.infer<typeof postJobSchema>
