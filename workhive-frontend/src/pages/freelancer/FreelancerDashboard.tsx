import { Link } from 'react-router'
import { 
  FileText, 
  Briefcase, 
  CheckCircle, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'

import { useMeQuery } from '@/store/api/authApi'
import { useGetMyBidsQuery } from '@/store/api/bidsApi'
import { useGetContractsQuery } from '@/store/api/contractsApi'
import { DashboardStats, StatCard } from '@/components/DashboardStats'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function FreelancerDashboard() {
  const { data: userData, isLoading: isLoadingUser } = useMeQuery()
  const { data: bidsData, isLoading: isLoadingBids } = useGetMyBidsQuery({ limit: 100 })
  const { data: contractsData, isLoading: isLoadingContracts } = useGetContractsQuery({ limit: 5 })
  const { data: activeContractsData } = useGetContractsQuery({ status: 'active', limit: 100 })

  const user = userData?.data
  const bids = bidsData?.data || []
  const recentContracts = contractsData?.data || []
  const activeContractsCount = activeContractsData?.data?.length || 0
  const pendingBidsCount = bids.filter(b => b.status === 'pending').length
  
  // Aggregate total earnings from completed contracts
  const totalEarnings = contractsData?.data?.reduce((acc, c) => {
    return c.status === 'completed' ? acc + c.amount : acc
  }, 0) || 0

  if (isLoadingUser || isLoadingBids || isLoadingContracts) {
    return <DashboardLoadingSkeleton />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Welcome back, {user?.full_name || 'Freelancer'}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here's what's happening with your projects today.
        </p>
      </div>

      <DashboardStats>
        <StatCard 
          title="Active Projects" 
          value={activeContractsCount} 
          icon={Briefcase}
          description="Ongoing workrooms"
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Pending Bids" 
          value={pendingBidsCount} 
          icon={FileText}
          description="Waiting for response"
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard 
          title="Completed" 
          value={recentContracts.filter(c => c.status === 'completed').length} 
          icon={CheckCircle}
          description="Total successful jobs"
          iconClassName="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Earnings" 
          value={`$${totalEarnings}`} 
          icon={DollarSign}
          trend={{ value: "+12%", positive: true }}
          description="From completed projects"
          iconClassName="bg-indigo-100 text-indigo-600"
        />
      </DashboardStats>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Contracts */}
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Recent Contracts</CardTitle>
              <CardDescription>Your most recent work assignments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
              <Link to="/freelancer/contracts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 opacity-20 mb-4" />
                <p>No contracts found yet. Start bidding to get hired!</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentContracts.map(contract => (
                  <div key={contract.id} className="py-4 flex items-center justify-between group">
                    <div className="space-y-1">
                      <Link 
                        to={`/freelancer/contracts/${contract.id}`}
                        className="font-semibold text-gray-900 group-hover:text-primary transition-colors"
                      >
                        {contract.job?.title || 'Untitled Project'}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {contract.amount}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Started {format(new Date(contract.started_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {contract.status}
                      </Badge>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/freelancer/contracts/${contract.id}`}>
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

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Growth Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-primary/10 shadow-sm">
                <p className="text-sm font-medium">Complete your profile</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Profiles with a detailed bio and avatar are 5x more likely to be hired.
                </p>
                <Button variant="link" size="sm" asChild className="p-0 h-auto mt-2 text-primary">
                  <Link to="/profile">Edit Profile</Link>
                </Button>
              </div>
              <div className="bg-white p-4 rounded-lg border border-primary/10 shadow-sm">
                <p className="text-sm font-medium">Stay Active</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check your messages regularly to maintain a high response rate.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-2 h-12" asChild>
                <Link to="/freelancer/jobs">
                  <Briefcase className="h-4 w-4" />
                  Browse New Jobs
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <MessageSquare className="h-4 w-4" />
                Support Center
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
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
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
