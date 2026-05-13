import { useState } from "react"
import { Link } from "react-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Loader2, 
  Edit2, 
  XSquare, 
  ChevronRight,
  X
} from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"

import { useGetMyBidsQuery, useUpdateBidMutation, useWithdrawBidMutation } from "@/store/api/bidsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { submitBidSchema, type SubmitBidFormValues } from "@/schemas/jobSchemas"

export default function MyBidsPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError, isFetching } = useGetMyBidsQuery({ page, limit })
  const [withdrawBid, { isLoading: isWithdrawing }] = useWithdrawBidMutation()
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    bidId: string
  }>({
    isOpen: false,
    bidId: "",
  })
  
  const [editingBidId, setEditingBidId] = useState<string | null>(null)

  const bids = data?.data || []
  const pagination = (data as any)?.pagination
  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || limit)) : 1

  const handleWithdraw = async (id: string) => {
    setConfirmConfig({ isOpen: true, bidId: id })
  }

  const handleConfirmWithdraw = async () => {
    const id = confirmConfig.bidId
    try {
      await withdrawBid(id).unwrap()
      toast.success("Proposal withdrawn successfully.")
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to withdraw proposal.")
    }
    setConfirmConfig({ isOpen: false, bidId: "" })
  }

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'pending': return 'secondary'
      case 'accepted': return 'default' // green-ish in custom theme
      case 'rejected': return 'destructive'
      case 'withdrawn': return 'outline'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-destructive">Failed to load your proposals.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Proposals</h1>
          <p className="text-muted-foreground">Manage your submitted bids and active proposals.</p>
        </div>
      </div>

      {bids.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-xl mb-2">No proposals yet</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            You haven't submitted any proposals. Browse available jobs to start bidding.
          </CardDescription>
          <Button asChild>
            <Link to="/freelancer/jobs">Browse Jobs</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Card key={bid.id} className={`overflow-hidden transition-all ${isFetching ? 'opacity-50' : ''}`}>
                {editingBidId === bid.id ? (
                  <EditBidForm 
                    bid={bid} 
                    onCancel={() => setEditingBidId(null)} 
                    onSuccess={() => setEditingBidId(null)} 
                  />
                ) : (
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                      <div className="space-y-1 flex-1">
                        {bid.job ? (
                          <Link to={`/freelancer/jobs/${bid.job.id}`} className="hover:text-indigo-600 transition-colors">
                            <h2 className="text-xl font-bold">{bid.job.title}</h2>
                          </Link>
                        ) : (
                          <h2 className="text-xl font-bold text-muted-foreground">Job Details Unavailable</h2>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Submitted {format(new Date(bid.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 text-right">
                        <div className="text-lg font-bold text-gray-900 flex items-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          {bid.amount}
                        </div>
                        <Badge variant={getStatusBadgeVariant(bid.status)} className="capitalize">
                          {bid.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-4 rounded-md border text-sm text-gray-700 whitespace-pre-wrap mb-4">
                      {bid.cover_letter}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {bid.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingBidId(bid.id)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleWithdraw(bid.id)}
                              disabled={isWithdrawing}
                            >
                              <XSquare className="h-4 w-4 mr-2" />
                              Withdraw
                            </Button>
                          </>
                        )}
                      </div>
                      {bid.job && (
                        <Button asChild variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600 text-sm group/btn ml-auto">
                          <Link to={`/freelancer/jobs/${bid.job.id}`}>
                            View Job
                            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {pagination && totalPages > 1 && (
            <Pagination className="mt-8 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, bidId: "" })}
        onConfirm={handleConfirmWithdraw}
        title="Withdraw Proposal"
        description="Are you sure you want to withdraw this proposal? You can still submit a new proposal later if the job is still open."
        variant="destructive"
        confirmText="Withdraw Proposal"
      />
    </div>
  )
}

function EditBidForm({ bid, onCancel, onSuccess }: { bid: any, onCancel: () => void, onSuccess: () => void }) {
  const [updateBid, { isLoading }] = useUpdateBidMutation()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SubmitBidFormValues>({
    resolver: zodResolver(submitBidSchema),
    defaultValues: {
      amount: String(bid.amount),
      cover_letter: bid.cover_letter,
    },
  })

  const onSubmit = async (values: SubmitBidFormValues) => {
    try {
      const payload = {
        amount: Number(values.amount),
        cover_letter: values.cover_letter,
      }
      await updateBid({ id: bid.id, data: payload }).unwrap()
      toast.success("Proposal updated successfully!")
      onSuccess()
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to update proposal.")
    }
  }

  return (
    <div className="p-6 bg-indigo-50/30">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <h3 className="font-semibold text-lg flex items-center">
          <Edit2 className="h-5 w-5 mr-2 text-indigo-600" />
          Edit Proposal
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-bid-amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  Bid Amount ($)
                </FieldLabel>
                <Input 
                  {...field} 
                  id="edit-bid-amount" 
                  type="number"
                  min="5"
                  disabled={isLoading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="cover_letter"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-bid-cover">Cover Letter</FieldLabel>
                <Textarea 
                  {...field} 
                  id="edit-bid-cover"
                  className="min-h-[150px]"
                  disabled={isLoading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
