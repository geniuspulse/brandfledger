"use client";
import { DollarSign, TrendingUp, TrendingDown, Clock, Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  business: { name: string; currency: string };
  stats: {
    revenue: number; expenses: number; profit: number;
    outstandingAmount: number; outstandingCount: number; customerCount: number;
  };
  recentInvoices: { id: string; total: number; status: string; created_at: string }[];
  recentPayments: { id: string; amount: number; date: string }[];
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

export function DashboardClient({ business, stats, recentInvoices, recentPayments }: Props) {
  const c = business.currency || "USD";
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
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Dashboard overview</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiles.map(t => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <t.icon className={`h-4 w-4 ${t.color}`} />
              </div>
              <p className="text-xl font-bold">{t.value}</p>
              {t.sub && <p className="text-xs text-muted-foreground mt-1">{t.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInvoices.length === 0
              ? <p className="text-sm text-muted-foreground">No invoices yet.</p>
              : recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</span>
                  <span className="font-medium">{fmt(Number(inv.total), c)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[inv.status] || ""}`}>
                    {inv.status}
                  </span>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayments.length === 0
              ? <p className="text-sm text-muted-foreground">No payments yet.</p>
              : recentPayments.map(pay => (
                <div key={pay.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(pay.date).toLocaleDateString()}</span>
                  <span className="font-medium text-green-600">{fmt(Number(pay.amount), c)}</span>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
