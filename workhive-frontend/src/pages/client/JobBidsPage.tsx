import { useParams, Link } from "react-router"
import { format } from "date-fns"
import { ArrowLeft, Loader2, DollarSign, FileText, CheckCircle2, XCircle } from "lucide-react"

import { useGetJobBidsQuery, useGetJobQuery } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function JobBidsPage() {
  const { id } = useParams()
  
  const { data: jobData, isLoading: isLoadingJob } = useGetJobQuery(id!)
  const { data: bidsData, isLoading: isLoadingBids, isError } = useGetJobBidsQuery(id!)

  const job = jobData?.data
  const bids = bidsData?.data || []

  if (isLoadingJob || isLoadingBids) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-destructive">Failed to load bids. The job might have been deleted.</p>
        <Button asChild variant="outline">
          <Link to="/client/jobs/my">Return to My Jobs</Link>
        </Button>
      </div>
    )
  }

  const getBidStatusBadge = (s: string) => {
    switch (s) {
      case 'pending': return 'secondary'
      case 'accepted': return 'default'
      case 'rejected': return 'destructive'
      case 'withdrawn': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/client/jobs/my">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Bids for "{job.title}"</h1>
          <p className="text-muted-foreground">Review proposals from freelancers.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 items-start">
        <div className="md:col-span-3 space-y-4">
          {bids.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <CardTitle className="text-xl mb-2">No bids yet</CardTitle>
              <CardDescription>
                Freelancers haven't submitted any proposals for this job yet. Check back later!
              </CardDescription>
            </Card>
          ) : (
            bids.map((bid) => (
              <Card key={bid.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={bid.freelancer?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {bid.freelancer?.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {bid.freelancer?.full_name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        Placed on {format(new Date(bid.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xl font-bold text-gray-900 flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      {bid.amount}
                    </div>
                    <Badge variant={getBidStatusBadge(bid.status)} className="capitalize">
                      {bid.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Cover Letter</h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border">
                      {bid.cover_letter}
                    </p>
                  </div>

                  {bid.status === 'pending' && job.status === 'open' && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed">
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Bid
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept & Create Contract
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="text-lg">Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className="capitalize mt-1">{job.status.replace('_', ' ')}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Range</p>
                <p className="font-semibold">${job.budget_min} - ${job.budget_max}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bids</p>
                <p className="font-semibold">{bids.length}</p>
              </div>
              <Button variant="link" className="px-0 w-full justify-start" asChild>
                <Link to={`/client/jobs/${job.id}`}>View Full Job Details &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
