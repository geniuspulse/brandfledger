import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  // Show landing page for non-authenticated users
  return <LandingPage />;
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">⚡ Brandfledger</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Now with AI-powered invoice generation
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Run your business.<br />
          <span className="text-primary">Not your spreadsheets.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Brandfledger gives small businesses a complete financial command center — invoices, expenses, payments, and reports — in one clean dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center justify-center rounded-md text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 transition-colors">
            Start free — no credit card
          </Link>
          <Link href="#features" className="inline-flex items-center justify-center rounded-md text-base font-medium border h-12 px-8 hover:bg-muted transition-colors">
            See how it works
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Free plan available · Setup in 2 minutes · No credit card required</p>
      </section>

      {/* Social proof bar */}
      <section className="border-y bg-muted/30 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,400+", label: "Businesses" },
              { value: "$12M+", label: "Invoiced" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9★", label: "Rating" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to get paid</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">One platform for your entire business finance workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📄",
              title: "Professional Invoices",
              description: "Create, send, and track invoices in seconds. PDF export, due-date reminders, and real-time payment status.",
            },
            {
              icon: "💰",
              title: "Expense Tracking",
              description: "Log expenses by category, attach receipts, and see exactly where your money goes each month.",
            },
            {
              icon: "📊",
              title: "Financial Reports",
              description: "P&L, revenue trends, and cash flow reports — all auto-generated from your real data.",
            },
            {
              icon: "👥",
              title: "Customer Management",
              description: "Keep a full history of every customer, their invoices, and payments in one place.",
            },
            {
              icon: "🏦",
              title: "Payment Recording",
              description: "Record payments by cash, bank transfer, mobile money, or card. Reconcile instantly.",
            },
            {
              icon: "🔐",
              title: "Team Access",
              description: "Invite accountants and team members with role-based permissions. Owner, admin, or viewer.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-muted-foreground">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "For freelancers getting started",
                features: ["5 invoices/month", "1 business profile", "Basic reports", "Customer management"],
                cta: "Get started free",
                href: "/register",
                highlighted: false,
              },
              {
                name: "Starter",
                price: "$12",
                period: "per month",
                description: "For growing small businesses",
                features: ["Unlimited invoices", "3 business profiles", "Full reports & exports", "Team members (up to 3)", "Priority support"],
                cta: "Start free trial",
                href: "/register",
                highlighted: true,
              },
              {
                name: "Pro",
                price: "$29",
                period: "per month",
                description: "For established businesses",
                features: ["Everything in Starter", "Unlimited businesses", "Unlimited team members", "API access", "Custom branding", "Dedicated support"],
                cta: "Start free trial",
                href: "/register",
                highlighted: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-8 ${plan.highlighted ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105" : "bg-card"}`}>
                <div className={`text-sm font-medium mb-2 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{plan.name}</div>
                <div className="text-4xl font-bold mb-1">{plan.price}</div>
                <div className={`text-sm mb-4 ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</div>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "" : ""}`}>
                      <span className={plan.highlighted ? "text-primary-foreground" : "text-primary"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center rounded-md font-medium py-2.5 transition-colors ${plan.highlighted ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold mb-6">Built for businesses that move fast</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Brandfledger was built because most accounting tools are either too complex or too limited. 
          We built something in between — powerful enough to run a real business, simple enough to set up in minutes.
        </p>
        <Link href="/register" className="inline-flex items-center justify-center rounded-md text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 transition-colors">
          Create your free account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-semibold text-foreground">⚡ Brandfledger</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <div>© {new Date().getFullYear()} Brandfledger. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
