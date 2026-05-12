import { Link } from 'react-router'
import { 
  Briefcase, 
  ShieldCheck, 
  Zap, 
  Star,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none rounded-lg px-4 py-1.5 font-bold text-xs uppercase tracking-widest">
                The Future of Work is Here
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Build your next <br />
                <span className="text-primary italic font-serif">extraordinary</span> vision.
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                The most secure workspace for ambitious clients and world-class freelancers to collaborate, track milestones, and settle payments with confidence.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button size="lg" className="h-14 px-10 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 w-full sm:w-auto transition-transform hover:scale-[1.02]" asChild>
                  <Link to="/register">Get Started Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 rounded-xl text-lg font-bold border-2 w-full sm:w-auto" asChild>
                  <Link to="/jobs">Browse Projects</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 pt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="font-bold text-slate-900 ml-1">4.9/5</span>
                  </div>
                  <p className="text-slate-500 font-medium">Trusted by 10,000+ users</p>
                </div>
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-2xl mx-auto lg:max-w-none">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-2 transform rotate-1 transition-transform hover:rotate-0 duration-500">
                <img 
                  src="/src/assets/hero-illustration.png" 
                  alt="Workhive Collaboration" 
                  className="rounded-xl w-full h-auto shadow-2xl grayscale"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 z-20 bg-white p-6 rounded-xl shadow-xl border border-slate-50 animate-bounce-slow hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none">$12.5k Earnt</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Today by our top freelancer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">Trusted by industry leaders worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Replace with real logos if available */}
            <span className="text-2xl font-bold text-slate-900">MICROSOFT</span>
            <span className="text-2xl font-bold text-slate-900">AIRBNB</span>
            <span className="text-2xl font-bold text-slate-900">STRIPE</span>
            <span className="text-2xl font-bold text-slate-900">DROPBOX</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <Badge className="bg-primary/5 text-primary border-none rounded-lg px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest">
              Why Workhive?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Everything you need to <br /> <span className="italic font-serif">succeed</span> remotely.
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              We've built the most secure and intuitive platform for the global workforce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-xl shadow-slate-100 rounded-2xl overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <CardContent className="p-10 space-y-6">
                <div className="h-16 w-16 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <ShieldCheck className="h-8 w-8 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Secure Escrow</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Fund your projects with peace of mind. Our Stripe-integrated escrow system ensures freelancers get paid when work is delivered, and clients only pay for results.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-100 rounded-2xl overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <CardContent className="p-10 space-y-6">
                <div className="h-16 w-16 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Zap className="h-8 w-8 text-purple-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Contextual Workrooms</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Every contract gets its own dedicated workroom. Chat, share files, and track project milestones in one centralized, real-time hub.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-100 rounded-2xl overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <CardContent className="p-10 space-y-6">
                <div className="h-16 w-16 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Globe className="h-8 w-8 text-green-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Global Talent</h3>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Access a worldwide network of experts across Development, Design, Marketing, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 pb-32">
        <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Ready to start your <br /> <span className="italic font-serif text-primary">next big thing?</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              Join the thousands of experts and businesses scaling their dreams on Workhive.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Button size="lg" className="h-16 px-12 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30 w-full sm:w-auto" asChild>
                <Link to="/register">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-12 rounded-xl text-lg font-bold border-white/20 text-black hover:bg-white hover:text-slate-900 w-full sm:w-auto border-2 transition-all" asChild>
                <Link to="/jobs">Explore Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">WorkHive</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">© 2026 WorkHive Inc. All rights reserved.</p>
          <div className="flex gap-8 text-sm font-bold text-slate-400">
            <Link to="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
