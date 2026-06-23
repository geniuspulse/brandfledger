// UPDATED: src/app/(dashboard)/dashboard/dashboard-client.tsx
// New: full setup checklist with inline business creation form + progress tracking

"use client";
import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, Users, FileText, CheckCircle2, Circle, Building2, UserPlus, Package, Zap, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "MWK", "ZAR", "NGN", "KES", "GHS"];

interface SetupStatus {
  hasBusiness: boolean;
  hasCustomer: boolean;
  hasProduct: boolean;
  hasInvoice: boolean;
}

interface Props {
  business: { name: string; currency: string; id?: string } | null;
  stats: {
    revenue: number; expenses: number; profit: number;
    outstandingAmount: number; outstandingCount: number; customerCount: number;
  };
  recentInvoices: { id: string; total: number; status: string; created_at: string }[];
  recentPayments: { id: string; amount: number; date: string }[];
  setupStatus: SetupStatus;
}

function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

// ─── Setup Checklist ─────────────────────────────────────────────────────────

function SetupChecklist({ initialStatus }: { initialStatus: SetupStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [expanded, setExpanded] = useState<string | null>(initialStatus.hasBusiness ? null : "business");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  // Business form state
  const [bizForm, setBizForm] = useState({ name: "", email: "", currency: "USD", invoice_prefix: "INV" });

  // Customer form state
  const [custForm, setCustForm] = useState({ name: "", email: "", phone: "" });

  // Product form state
  const [prodForm, setProdForm] = useState({ name: "", price: "", category: "" });

  const completedCount = [status.hasBusiness, status.hasCustomer, status.hasProduct, status.hasInvoice].filter(Boolean).length;
  const allDone = completedCount === 4;

  if (dismissed || allDone) return null;

  const steps = [
    {
      id: "business",
      label: "Set up your business",
      description: "Add your business name, currency, and details",
      icon: Building2,
      done: status.hasBusiness,
      form: (
        <div className="space-y-3 mt-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Business name *</Label>
              <Input className="h-8 text-sm" placeholder="Acme Ltd" value={bizForm.name} onChange={e => setBizForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business email</Label>
              <Input className="h-8 text-sm" type="email" placeholder="info@acme.com" value={bizForm.email} onChange={e => setBizForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Invoice prefix</Label>
              <Input className="h-8 text-sm" placeholder="INV" value={bizForm.invoice_prefix} onChange={e => setBizForm(p => ({ ...p, invoice_prefix: e.target.value.toUpperCase() }))} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Currency</Label>
              <Select value={bizForm.currency} onValueChange={v => setBizForm(p => ({ ...p, currency: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" disabled={loading || !bizForm.name} onClick={async () => {
            setLoading(true); setError("");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Not signed in"); setLoading(false); return; }
            const { data: biz, error: e } = await supabase.from("businesses").insert({ ...bizForm, owner_id: user.id }).select().single();
            if (e) { setError(e.message); setLoading(false); return; }
            await supabase.from("business_members").insert({ business_id: biz.id, user_id: user.id, role: "owner" });
            setStatus(s => ({ ...s, hasBusiness: true }));
            setExpanded("customer");
            setLoading(false);
            router.refresh();
          }}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save business
          </Button>
        </div>
      ),
    },
    {
      id: "customer",
      label: "Add your first customer",
      description: "Who do you do business with?",
      icon: UserPlus,
      done: status.hasCustomer,
      form: (
        <div className="space-y-3 mt-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Customer name *</Label>
              <Input className="h-8 text-sm" placeholder="Jane Smith" value={custForm.name} onChange={e => setCustForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-8 text-sm" type="email" placeholder="jane@example.com" value={custForm.email} onChange={e => setCustForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className="h-8 text-sm" placeholder="+1 555 0100" value={custForm.phone} onChange={e => setCustForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={loading || !custForm.name} onClick={async () => {
              setLoading(true); setError("");
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
              const { error: e } = await supabase.from("customers").insert({ ...custForm, business_id: biz!.id });
              if (e) { setError(e.message); setLoading(false); return; }
              setStatus(s => ({ ...s, hasCustomer: true }));
              setExpanded("product");
              setLoading(false);
            }}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Add customer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setStatus(s => ({ ...s, hasCustomer: true })); setExpanded("product"); }}>
              Skip
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "product",
      label: "Add a product or service",
      description: "What do you sell or charge for?",
      icon: Package,
      done: status.hasProduct,
      form: (
        <div className="space-y-3 mt-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input className="h-8 text-sm" placeholder="Web design — hourly" value={prodForm.name} onChange={e => setProdForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price</Label>
              <Input className="h-8 text-sm" type="number" min="0" placeholder="0.00" value={prodForm.price} onChange={e => setProdForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Input className="h-8 text-sm" placeholder="Services" value={prodForm.category} onChange={e => setProdForm(p => ({ ...p, category: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={loading || !prodForm.name} onClick={async () => {
              setLoading(true); setError("");
              const supabase = createClient();
              const { data: { user } } = await supabase.auth.getUser();
              const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user!.id).single();
              const { error: e } = await supabase.from("products").insert({ name: prodForm.name, price: parseFloat(prodForm.price) || 0, category: prodForm.category, business_id: biz!.id });
              if (e) { setError(e.message); setLoading(false); return; }
              setStatus(s => ({ ...s, hasProduct: true }));
              setExpanded("invoice");
              setLoading(false);
            }}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Add product
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setStatus(s => ({ ...s, hasProduct: true })); setExpanded("invoice"); }}>
              Skip
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: "invoice",
      label: "Create your first invoice",
      description: "Send your first invoice and get paid",
      icon: FileText,
      done: status.hasInvoice,
      form: (
        <div className="mt-3">
          <Button size="sm" asChild>
            <a href="/invoices">Go to Invoices →</a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="border-primary/20 bg-primary/5 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        title="Dismiss checklist"
      >
        <X className="h-4 w-4" />
      </button>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Get started with Brandfledger</CardTitle>
          </div>
        </div>
        <CardDescription>Complete these steps to set up your account</CardDescription>
        {/* Progress bar */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedCount} of 4 completed</span>
            <span>{Math.round((completedCount / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isOpen = expanded === step.id;
          const isLocked = !step.done && i > 0 && !steps[i - 1].done;
          return (
            <div key={step.id} className={`rounded-lg border bg-card transition-all ${step.done ? "opacity-60" : ""} ${isOpen ? "border-primary/30" : "border-transparent"}`}>
              <button
                className="w-full flex items-center gap-3 p-3 text-left"
                onClick={() => !isLocked && setExpanded(isOpen ? null : step.id)}
                disabled={isLocked}
              >
                <div className="shrink-0">
                  {step.done
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className={`h-5 w-5 ${isLocked ? "text-muted-foreground/30" : "text-primary"}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isLocked ? "text-muted-foreground/50" : ""}`}>{step.label}</p>
                  {!step.done && !isOpen && <p className="text-xs text-muted-foreground">{step.description}</p>}
                </div>
                {!step.done && !isLocked && (
                  isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {isOpen && !step.done && (
                <div className="px-3 pb-3 border-t border-border/50 pt-2">
                  {step.form}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function DashboardClient({ business, stats, recentInvoices, recentPayments, setupStatus }: Props) {
  const c = business?.currency || "USD";
  const allSetUp = setupStatus.hasBusiness && setupStatus.hasCustomer && setupStatus.hasProduct && setupStatus.hasInvoice;

  const tiles = [
    { label: "Total Revenue", value: fmt(stats.revenue, c), icon: DollarSign, color: "text-green-600" },
    { label: "Total Expenses", value: fmt(stats.expenses, c), icon: TrendingDown, color: "text-red-500" },
    { label: "Net Profit", value: fmt(stats.profit, c), icon: TrendingUp, color: stats.profit >= 0 ? "text-green-600" : "text-red-500" },
    { label: "Outstanding", value: fmt(stats.outstandingAmount, c), icon: Clock, color: "text-amber-500", sub: `${stats.outstandingCount} invoice${stats.outstandingCount !== 1 ? "s" : ""}` },
    { label: "Customers", value: String(stats.customerCount), icon: Users, color: "text-primary" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{business?.name ?? "Welcome to Brandfledger"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {business ? "Dashboard overview" : "Let's get you set up"}
        </p>
      </div>

      {/* Setup checklist — shows for new users, disappears when all done */}
      <SetupChecklist initialStatus={setupStatus} />

      {/* Only show stats if business exists */}
      {business && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tiles.map(t => (
              <Card key={t.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                    <t.icon className={`h-4 w-4 ${t.color}`} />
                  </div>
                  <p className="text-xl font-bold">{t.value}</p>
                  {(t as any).sub && <p className="text-xs text-muted-foreground mt-0.5">{(t as any).sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent invoices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
                ) : recentInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fmt(inv.total, c)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor[inv.status] ?? ""}`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent payments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No payments recorded yet</p>
                ) : recentPayments.map(pay => (
                  <div key={pay.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{new Date(pay.date).toLocaleDateString()}</span>
                    <span className="font-medium text-green-600">+{fmt(pay.amount, c)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
