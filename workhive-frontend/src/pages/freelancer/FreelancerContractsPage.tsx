import { useState } from "react"
import { Link } from "react-router"
import { format } from "date-fns"
import { Loader2, FileText, Clock, CheckCircle2, ChevronRight, DollarSign } from "lucide-react"

import { useGetContractsQuery } from "@/store/api/contractsApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function FreelancerContractsPage() {
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError, isFetching } = useGetContractsQuery({ page, limit })
  
  const contracts = data?.data || []
  const pagination = data?.pagination
  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || limit)) : 1

  const getStatusBadgeVariant = (s: string) => {
    switch (s) {
      case 'active': return 'default' // primary
      case 'completed': return 'secondary' // or green if customized
      case 'cancelled': return 'destructive'
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
        <p className="text-destructive">Failed to load contracts.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">My Contracts</h1>
          <p className="text-muted-foreground">Manage your active and past working engagements.</p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="text-xl mb-2">No contracts found</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            You don't have any active or past contracts. Submit proposals to jobs to get hired!
          </CardDescription>
          <Button asChild>
            <Link to="/freelancer/jobs">Browse Jobs</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className={`overflow-hidden transition-all ${isFetching ? 'opacity-50' : ''} hover:shadow-md`}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div className="space-y-1 flex-1">
                      {contract.job ? (
                        <Link to={`/freelancer/contracts/${contract.id}`} className="hover:text-indigo-600 transition-colors">
                          <h2 className="text-xl font-bold">{contract.job.title}</h2>
                        </Link>
                      ) : (
                        <h2 className="text-xl font-bold text-muted-foreground">Job Details Unavailable</h2>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Started {format(new Date(contract.started_at), 'MMM d, yyyy')}
                        </span>
                        {contract.client && (
                          <span className="flex items-center text-gray-700 font-medium ml-2">
                            Client: {contract.client.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="text-lg font-bold text-gray-900 flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        {contract.amount}
                      </div>
                      <Badge variant={getStatusBadgeVariant(contract.status)} className="capitalize">
                        {contract.status === 'active' && <Clock className="mr-1 h-3 w-3" />}
                        {contract.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {contract.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button asChild variant="default" className="text-sm group/btn ml-auto">
                      <Link to={`/freelancer/contracts/${contract.id}`}>
                        View Workroom
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
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
    </div>
  )
}
