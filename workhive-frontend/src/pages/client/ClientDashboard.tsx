import { Link } from 'react-router'
import { 
  PlusCircle, 
  Briefcase, 
  FileText, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  Zap,
  Users
} from 'lucide-react'
import { format } from 'date-fns'

import { useMeQuery } from '@/store/api/authApi'
import { useGetMyJobsQuery } from '@/store/api/jobsApi'
import { useGetContractsQuery } from '@/store/api/contractsApi'
import { DashboardStats, StatCard } from '@/components/DashboardStats'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientDashboard() {
  const { data: userData, isLoading: isLoadingUser } = useMeQuery()
  const { data: jobsData, isLoading: isLoadingJobs } = useGetMyJobsQuery({ limit: 5 })
  const { data: contractsData, isLoading: isLoadingContracts } = useGetContractsQuery({ limit: 100 })
  const { data: openJobsData } = useGetMyJobsQuery({ limit: 100 })

  const user = userData?.data
  const recentJobs = jobsData?.data || []
  const allContracts = contractsData?.data || []
  const activeContracts = allContracts.filter(c => c.status === 'active')
  const openJobsCount = openJobsData?.data?.filter(j => j.status === 'open').length || 0
  
  // Aggregate total spent from all contracts
  const totalSpent = allContracts.reduce((acc, c) => acc + c.amount, 0)

  if (isLoadingUser || isLoadingJobs || isLoadingContracts) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Client Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your job posts and track project progress.
          </p>
        </div>
        <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Link to="/client/jobs/post">
            <PlusCircle className="h-5 w-5" />
            Post a New Job
          </Link>
        </Button>
      </div>

      <DashboardStats>
        <StatCard 
          title="Open Jobs" 
          value={openJobsCount} 
          icon={Briefcase}
          description="Actively hiring"
          iconClassName="bg-indigo-100 text-indigo-600"
        />
        <StatCard 
          title="Active Projects" 
          value={activeContracts.length} 
          icon={Zap}
          description="Contracts in progress"
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard 
          title="Total Spent" 
          value={`$${totalSpent}`} 
          icon={DollarSign}
          description="Lifetime expenditure"
          iconClassName="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Average Budget" 
          value={recentJobs.length > 0 ? `$${Math.round(recentJobs.reduce((acc, j) => acc + (j.budget_min + j.budget_max)/2, 0) / recentJobs.length)}` : '$0'} 
          icon={Clock}
          description="Per job post"
          iconClassName="bg-purple-100 text-purple-600"
        />
      </DashboardStats>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Job Posts */}
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Your Job Posts</CardTitle>
              <CardDescription>Latest roles you've advertised</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
              <Link to="/client/jobs">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                <FileText className="h-12 w-12 opacity-20 mb-4" />
                <p>You haven't posted any jobs yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/client/jobs/post">Get started now</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recentJobs.map(job => (
                  <div key={job.id} className="py-4 flex items-center justify-between group">
                    <div className="space-y-1">
                      <Link 
                        to={`/client/jobs/${job.id}`}
                        className="font-semibold text-gray-900 group-hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-normal">{job.category}</Badge>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Posted {format(new Date(job.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="capitalize">
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/client/jobs/${job.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-indigo-100 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Active Freelancers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active contracts. Review your bids to start working!</p>
              ) : (
                <div className="space-y-3">
                  {activeContracts.slice(0, 3).map(contract => (
                    <div key={contract.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {contract.freelancer?.full_name?.[0] || 'F'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contract.freelancer?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contract.job?.title}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/client/contracts/${contract.id}`}>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/client/contracts">
                  <FileText className="h-4 w-4" />
                  Manage Contracts
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <Link to="/payments">
                  <DollarSign className="h-4 w-4" />
                  Transaction History
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-12 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  )
}
