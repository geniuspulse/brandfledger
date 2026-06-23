import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user!.id)
    .single();

  if (!business) return null;

  const [{ data: invoices }, { data: expenses }] = await Promise.all([
    supabase.from("invoices").select("*").eq("business_id", business.id),
    supabase.from("expenses").select("*").eq("business_id", business.id),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const paidInvoices = invoices?.filter(i => i.status === "paid") ?? [];
  const sentInvoices = invoices?.filter(i => i.status === "sent") ?? [];
  const overdueInvoices = invoices?.filter(i => i.status === "overdue") ?? [];

  const totalRevenue = paidInvoices.reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const outstanding = sentInvoices.reduce((s, i) => s + i.total, 0) +
    overdueInvoices.reduce((s, i) => s + i.total, 0);

  const recentInvoices = invoices?.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5) ?? [];

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue, business.currency), icon: DollarSign, color: "text-green-600", change: "+12% this month" },
    { label: "Total Expenses", value: formatCurrency(totalExpenses, business.currency), icon: TrendingDown, color: "text-red-500", change: "+3% this month" },
    { label: "Net Profit", value: formatCurrency(netProfit, business.currency), icon: TrendingUp, color: netProfit >= 0 ? "text-green-600" : "text-red-500", change: netProfit >= 0 ? "Positive" : "Negative" },
    { label: "Outstanding", value: formatCurrency(outstanding, business.currency), icon: FileText, color: "text-orange-500", change: `${sentInvoices.length + overdueInvoices.length} invoices` },
  ];

  return (
    <div>
      <Header title={`Welcome back 👋`} description={business.name} />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Link href="/invoices" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet. <Link href="/invoices" className="text-primary hover:underline">Create your first invoice →</Link></p>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issue_date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(inv.status)}>{inv.status}</Badge>
                      <span className="text-sm font-semibold">{formatCurrency(inv.total, business.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
