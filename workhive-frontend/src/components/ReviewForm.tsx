import { useState } from 'react'
import { Star, Loader2, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import { useSubmitReviewMutation } from '@/store/api/reviewsApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(500),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  contractId: string
  onSuccess?: () => void
}

export function ReviewForm({ contractId, onSuccess }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitReview, { isLoading }] = useSubmitReviewMutation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  })

  const rating = watch('rating')

  const onSubmit = async (data: ReviewFormValues) => {
    try {
      await submitReview({
        contractId,
        body: data,
      }).unwrap()
      toast.success('Review submitted successfully!')
      onSuccess?.()
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to submit review')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>Rating</FieldLabel>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setValue('rating', star, { shouldValidate: true })}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
        </Field>

        <Field>
          <FieldLabel htmlFor="comment">Your Feedback</FieldLabel>
          <Textarea
            id="comment"
            placeholder="Share your experience working on this project..."
            className="min-h-[120px] resize-none"
            {...register('comment')}
          />
          <FieldError>{errors.comment?.message}</FieldError>
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Submit Review
      </Button>
    </form>
  )
}
