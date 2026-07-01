import { createClient } from "@/lib/supabase/server";
import { getDefaultBusiness } from "@/lib/default-business";
import DashboardClient from "./dashboard-client";

export const metadata = { title: "Dashboard" };

function getPeriodRange(period: string) {
  const now = new Date();
  let start: Date;
  const end: Date = now;
  switch (period) {
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "this_quarter":
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "this_year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "all_time":
      start = new Date(2000, 0, 1);
      break;
    case "this_month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  // last_month should stop at the end of that month, not run into today
  const rangeEnd = period === "last_month" ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) : end;
  return { start, end: rangeEnd };
}

// TEMPORARY: auth removed while it's being rebuilt from scratch.
// This page now operates on a single shared "default" business.
export default async function DashboardPage({ searchParams }: { searchParams: { period?: string } }) {
  const supabase = await createClient();
  const period = searchParams?.period ?? "this_month";

  const { data: business } = await getDefaultBusiness(supabase);

  if (!business) {
    return <DashboardClient business={null} stats={null} setupStatus={{ hasBusiness: false, hasCustomer: false, hasProduct: false, hasInvoice: false }} period={period} />;
  }

  const [
    { data: invoices },
    { data: expenses },
    { data: customers },
  ] = await Promise.all([
    supabase.from("invoices").select("total, status, issue_date, created_at, id, invoice_number, customer_id, customers(name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("expenses").select("amount, date").eq("business_id", business.id),
    supabase.from("customers").select("id").eq("business_id", business.id),
  ]);

  const allInvoices = invoices ?? [];
  const allExpenses = expenses ?? [];

  // Period-scoped slices for the top summary cards (This Month / Last Month / etc.)
  const { start, end } = getPeriodRange(period);
  const inRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };
  const periodInvoices = allInvoices.filter(i => inRange(i.issue_date));
  const periodExpenses = allExpenses.filter(e => inRange(e.date));

  const paidPeriodInvoices = periodInvoices.filter(i => i.status === "paid");
  const revenue = paidPeriodInvoices.reduce((s, i) => s + i.total, 0);
  const totalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);

  const salesInvoices = periodInvoices.filter(i => i.status !== "draft");
  const totalSalesCount = salesInvoices.length;
  const totalSalesAmount = salesInvoices.reduce((s, i) => s + i.total, 0);

  // Outstanding is a "right now" metric — not scoped to the selected period
  const outstandingInvoices = allInvoices.filter(i => i.status === "sent" || i.status === "overdue");
  const outstandingAmount = outstandingInvoices.reduce((s, i) => s + i.total, 0);

  const { data: hasCustomer } = await supabase.from("customers").select("id").eq("business_id", business.id).limit(1);
  const { data: hasProduct } = await supabase.from("products").select("id").eq("business_id", business.id).limit(1);
  const { data: hasInvoice } = await supabase.from("invoices").select("id").eq("business_id", business.id).limit(1);

  // Last 6 months of revenue vs expenses, for the trend chart — independent of the period filter above
  const monthMap: Record<string, { month: string; revenue: number; expenses: number }> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = { month: d.toLocaleDateString("en-US", { month: "short" }), revenue: 0, expenses: 0 };
  }
  allInvoices.filter(i => i.status === "paid").forEach(inv => {
    if (!inv.issue_date) return;
    const key = inv.issue_date.slice(0, 7);
    if (monthMap[key]) monthMap[key].revenue += inv.total;
  });
  allExpenses.forEach(exp => {
    if (!exp.date) return;
    const key = exp.date.slice(0, 7);
    if (monthMap[key]) monthMap[key].expenses += exp.amount;
  });
  const monthlyTrend = Object.values(monthMap);

  // Top customers by total billed (all-time, all non-draft invoices) — computed live, not the stale customers.total_invoiced column
  const customerTotals: Record<string, { name: string; total: number; invoiceCount: number }> = {};
  allInvoices.filter(i => i.status !== "draft").forEach(inv => {
    const name = (inv as any).customers?.name ?? "Unknown customer";
    const key = inv.customer_id ?? name;
    if (!customerTotals[key]) customerTotals[key] = { name, total: 0, invoiceCount: 0 };
    customerTotals[key].total += inv.total;
    customerTotals[key].invoiceCount += 1;
  });
  const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <DashboardClient
      business={business}
      period={period}
      stats={{
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
        outstandingAmount,
        outstandingCount: outstandingInvoices.length,
        customerCount: (customers ?? []).length,
        totalSalesCount,
        totalSalesAmount,
      }}
      setupStatus={{
        hasBusiness: true,
        hasCustomer: (hasCustomer ?? []).length > 0,
        hasProduct: (hasProduct ?? []).length > 0,
        hasInvoice: (hasInvoice ?? []).length > 0,
      }}
      recentInvoices={allInvoices.slice(0, 5)}
      monthlyTrend={monthlyTrend}
      topCustomers={topCustomers}
    />
  );
}
