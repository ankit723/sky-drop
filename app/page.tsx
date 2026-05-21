import Link from "next/link";
import { Plane, Package, MapPin, Cpu, Zap, Shield, Clock, ArrowRight, Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <Plane className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold">Sky<span className="text-primary">Drop</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/track" className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted hover:text-foreground"><Search className="w-4 h-4" />Track</Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-6">
            <Zap className="w-3 h-3" /> Drone-Powered Last-Mile Delivery
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Deliver Packages<br />
            <span className="gradient-text">Faster Than Ever</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            SkyDrop uses autonomous drones to deliver packages across the city in minutes, not hours. Real-time tracking, automated logistics, zero traffic delays.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 text-lg">
              Start Delivering <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/track" className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-surface-hover text-lg">
              <Package className="w-5 h-5" /> Track a Package
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-sky-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why SkyDrop?</h2>
            <p className="text-muted max-w-lg mx-auto">Our drone delivery platform is built for speed, reliability, and transparency.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Deliveries completed in 15-30 minutes. No traffic, no delays.", color: "text-accent", bg: "bg-accent/10" },
              { icon: MapPin, title: "Real-Time Tracking", desc: "Track your package live on the map with GPS coordinates.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Shield, title: "Safe & Reliable", desc: "Autonomous drones with 99.5% delivery success rate.", color: "text-success", bg: "bg-success/10" },
              { icon: Cpu, title: "Smart Assignment", desc: "AI picks the nearest station and optimal drone automatically.", color: "text-secondary", bg: "bg-secondary/10" },
              { icon: Clock, title: "24/7 Operations", desc: "Drone stations operate round the clock for your business.", color: "text-warning", bg: "bg-warning/10" },
              { icon: Package, title: "Easy Integration", desc: "Simple dashboard for businesses to manage all deliveries.", color: "text-error", bg: "bg-error/10" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-border-light p-6 hover:shadow-lg hover:-translate-y-1">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Place Order", desc: "Submit delivery request with pickup and drop location" },
              { step: "2", title: "Station Assigned", desc: "Nearest drone station accepts your order" },
              { step: "3", title: "Drone Dispatched", desc: "Autonomous drone picks up your package" },
              { step: "4", title: "Delivered!", desc: "Package arrives at destination in minutes" },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">{s.step}</div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">SkyDrop</span>
            <span className="text-xs text-muted">© 2026</span>
          </div>
          <p className="text-xs text-muted">Drone-based last-mile delivery platform</p>
        </div>
      </footer>
    </div>
  );
}
