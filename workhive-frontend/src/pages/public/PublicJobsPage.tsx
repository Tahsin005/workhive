import { useState } from "react"
import { Link } from "react-router"
import { format } from "date-fns"
import { 
  Search, 
  Briefcase, 
  Clock, 
  Filter,
  ArrowRight,
  Zap
} from "lucide-react"

import { useGetJobsQuery } from "@/store/api/jobsApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function PublicJobsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("all")
  const limit = 9

  const { data, isLoading } = useGetJobsQuery({ 
    page, 
    limit, 
    search: search || undefined,
    category: category === 'all' ? undefined : category
  })

  const jobs = data?.data || []
  const pagination = (data as any)?.pagination
  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || limit)) : 1

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-10">
      <section className="relative pt-20 pb-32 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-[120px]" />
        </div>

        <div className="container relative mx-auto px-6 text-center space-y-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
              Join thousands of world-class freelancers making their mark. Browse high-budget projects across development, design, and more.
            </p>
          </div>

          <div className="max-w-3xl mx-auto pt-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-xl shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="What skills do you have? (e.g. React, UX Design)"
                  className="pl-12 h-14 border-none bg-transparent focus-visible:ring-0 text-lg font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="rounded-lg px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                Browse Jobs
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>
                {(category !== 'all' || search) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setCategory('all'); setSearch(''); setPage(1); }}
                    className="text-xs font-bold text-primary hover:bg-primary/5"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
                <div className="grid gap-2">
                  {['all', 'Development', 'Design', 'Marketing', 'Writing'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setPage(1); }}
                      className={`flex items-center justify-between p-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                        category === cat 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                          : 'bg-white text-slate-600 hover:bg-slate-100 hover:translate-x-1'
                      }`}
                    >
                      <span className="capitalize">{cat === 'all' ? 'All Categories' : cat}</span>
                      {category === cat && <Zap className="h-4 w-4 fill-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-8 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 space-y-4">
                  <h4 className="text-lg font-bold leading-tight">Can't find the right project?</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Create a profile to get personalized job recommendations based on your unique skill set.</p>
                  <Button variant="outline" className="w-full h-12 rounded-lg border-white/20 text-white hover:bg-white hover:text-slate-900 font-bold border-2 transition-all" asChild>
                    <Link to="/register">Join Workhive</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-10">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-100 space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center mx-auto">
                  <Briefcase className="h-10 w-10 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">No jobs found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    We couldn't find any opportunities matching your criteria. 
                    Try adjusting your filters or search terms.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => { setCategory('all'); setSearch(''); setPage(1); }}
                  className="rounded-lg px-8 h-12 font-bold"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <Card 
                      key={job.id} 
                      className="border-none rounded-xl bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-lg px-4 py-1 font-bold text-[10px] uppercase tracking-widest">
                            {job.category}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(job.created_at), 'MMM d')}
                          </div>
                        </div>

                        <div className="space-y-4 flex-1">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                            {job.title}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed font-medium italic">
                            "{job.description}"
                          </p>
                        </div>

                        <div className="pt-8 mt-8 flex items-center justify-between border-t border-slate-50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Range</p>
                            <p className="text-xl font-bold text-slate-900">
                              ${job.budget_min.toLocaleString()} - ${job.budget_max.toLocaleString()}
                            </p>
                          </div>
                           <Button asChild variant="ghost" className="rounded-lg group/btn font-bold text-slate-900 hover:bg-slate-100 h-12 px-6">
                            <Link to={`/jobs/${job.id}`} className="flex items-center gap-2">
                              Explore
                              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {pagination && totalPages > 1 && (
                  <div className="flex justify-center pt-10">
                    <Pagination>
                      <PaginationContent className="bg-white rounded-xl p-2 shadow-xl shadow-slate-200 border border-slate-100">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={`rounded-lg h-12 w-12 flex items-center justify-center p-0 transition-all ${page === 1 ? "pointer-events-none opacity-30" : "cursor-pointer hover:bg-primary hover:text-white"}`}
                          />
                        </PaginationItem>
                        
                        <div className="flex items-center px-8">
                          <span className="text-lg font-bold tracking-tighter">
                            {page} <span className="text-slate-200 font-medium italic mx-1">/</span> {totalPages}
                          </span>
                        </div>

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={`rounded-lg h-12 w-12 flex items-center justify-center p-0 transition-all ${page === totalPages ? "pointer-events-none opacity-30" : "cursor-pointer hover:bg-primary hover:text-white"}`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
