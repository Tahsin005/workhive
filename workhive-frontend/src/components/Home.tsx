import { Zap, Shield, Users, ArrowRight } from "lucide-react"
import Navbar from "./Navbar"
import { Button } from "./ui/button"

const Bee = () => {
    return (
        <div className="relative w-64 h-64 animate-float group cursor-pointer">
            <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Wings */}
                <ellipse
                    cx="70" cy="80" rx="30" ry="15"
                    className="fill-primary/20 stroke-primary/40 stroke-2 animate-flap origin-right"
                    style={{ transformOrigin: '90px 80px' }}
                />
                <ellipse
                    cx="130" cy="80" rx="30" ry="15"
                    className="fill-primary/20 stroke-primary/40 stroke-2 animate-flap origin-left"
                    style={{ transformOrigin: '110px 80px', animationDelay: '0.05s' }}
                />
                
                {/* Body */}
                <rect x="75" y="90" width="50" height="70" rx="25" className="fill-primary stroke-foreground stroke-2" />
                
                {/* Stripes */}
                <rect x="75" y="110" width="50" height="10" className="fill-foreground/80" />
                <rect x="75" y="130" width="50" height="10" className="fill-foreground/80" />
                
                {/* Eyes */}
                <circle cx="88" cy="105" r="3" className="fill-foreground" />
                <circle cx="112" cy="105" r="3" className="fill-foreground" />
                
                {/* Antennae */}
                <path d="M90 90 Q85 70 75 75" className="stroke-foreground stroke-2" strokeLinecap="round" />
                <path d="M110 90 Q115 70 125 75" className="stroke-foreground stroke-2" strokeLinecap="round" />
            </svg>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 blur-3xl -z-10 rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
        </div>
    )
}

const Home = () => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-dot-pattern">
            <Navbar />
            <section className="relative pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground text-xs font-semibold uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            The future of work is here
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Collaborate and <br />
                            <span className="text-primary bg-clip-text">Thrive in the Hive</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                            The premium marketplace for elite freelancers and ambitious companies. 
                            Find your next big opportunity or build your dream team with ease.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-semibold group shadow-xl shadow-primary/20">
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-semibold glass">
                                How it works
                            </Button>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                                <div className="w-10 h-10 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                    +2k
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-bold text-foreground">2,000+</span> professionals joined this week
                            </p>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-center lg:justify-end">
                        <div className="absolute w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
                        <Bee />
                        
                        <div className="absolute bottom-10 left-0 glass p-4 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Security</p>
                                    <p className="text-sm font-bold">Verified Hive</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-10 right-0 glass p-4 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Community</p>
                                    <p className="text-sm font-bold">50k+ Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to scale</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We've built the tools so you can focus on what matters: delivering high-quality work and growing your business.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Zap, title: "Fast Matching", desc: "Our AI-powered engine finds the perfect match for your skills or project in minutes." },
                            { icon: Shield, title: "Secure Payments", desc: "Escrow protection and seamless global payments ensure you get paid on time, every time." },
                            { icon: Users, title: "Collaborative Tools", desc: "Built-in project management and real-time communication tools for seamless teamwork." }
                        ].map((feature, i) => (
                            <div key={i} className="glass p-8 rounded-3xl group hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="fixed top-0 right-0 -z-20 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="fixed bottom-0 left-0 -z-20 w-[600px] h-[600px] bg-secondary/20 blur-[150px] rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
    )
}

export default Home