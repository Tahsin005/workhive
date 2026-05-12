import { useParams, Link } from "react-router"
import { format } from "date-fns"
import { 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Briefcase,
  ChevronRight,
  LogIn,
  Zap,
  Globe,
  Building
} from "lucide-react"

import { useGetJobQuery } from "@/store/api/jobsApi"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function PublicJobDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  
  const { data: jobData, isLoading, isError } = useGetJobQuery(id!)
  const job = jobData?.data

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-32 space-y-8 mt-16">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center px-4">
        <div className="w-24 h-24 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <Briefcase className="h-12 w-12 text-red-500 opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Opportunity not found</h2>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">
            This job might have been filled, removed, or the link is broken.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" className="rounded-lg px-10 h-14 border-2 font-bold">
          <Link to="/jobs">Browse Other Jobs</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <section className="bg-white border-b border-slate-100 pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-primary hover:bg-primary/5 mb-4 rounded-lg pl-2 pr-4 group transition-all">
              <Link to="/jobs" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to all jobs
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary text-white border-none rounded-lg px-4 py-1 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                    {job.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    Posted {format(new Date(job.created_at), 'MMMM d, yyyy')}
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                  {job.title}
                </h1>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Budget</p>
                <div className="text-3xl font-bold text-slate-900 bg-slate-50 px-6 py-3 rounded-lg border border-slate-100">
                  <span className="text-primary mr-1">$</span>
                  {job.budget_min.toLocaleString()} - {job.budget_max.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg font-medium italic">
                  "{job.description}"
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Project Type</h4>
                      <p className="text-sm text-slate-500 font-medium">{job.category} Specialist</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Location</h4>
                      <p className="text-sm text-slate-500 font-medium">Remote / Worldwide</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isAuthenticated && (
              <Card className="border-none rounded-2xl bg-slate-900 text-white p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10 space-y-8 text-center sm:text-left">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold leading-tight italic">Ready to work on this?</h3>
                    <p className="text-slate-400 text-lg max-w-xl font-medium">
                      Join Workhive to submit your proposal, chat with the client, and secure your payment through our Stripe-integrated escrow system.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="rounded-lg px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                      <Link to="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Log in to Apply
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-lg px-10 h-14 text-lg font-bold border-white/20 text-black hover:bg-white hover:text-slate-900 transition-all border-2">
                      <Link to="/register">Create Free Account</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <Card className="border-none rounded-2xl bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-xl font-bold text-slate-900 italic">About the Client</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20 shadow-inner">
                    {job.client?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-lg leading-none">{job.client?.full_name}</p>
                    <div className="flex items-center text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-sm border border-green-100 w-fit">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Verified
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Building className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry</p>
                      <p className="text-sm font-bold text-slate-700">Technology & SaaS</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Globe className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Member Since</p>
                      <p className="text-sm font-bold text-slate-700">May 12, 2026</p>
                    </div>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="p-6 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Competition Level</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 italic">15-20 Proposals</span>
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold">High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isAuthenticated && (
              <Button asChild size="lg" className="w-full rounded-xl h-16 text-lg font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Link to={`/freelancer/jobs/${job.id}`}>
                  Submit Your Proposal
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
