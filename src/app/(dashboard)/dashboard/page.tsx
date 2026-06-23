import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!businesses || businesses.length === 0) {
    redirect("/onboarding");
  }

  const business = businesses[0];

  // Fetch dashboard stats
  const [
    { data: invoices },
    { data: expenses },
    { data: payments },
    { data: customers },
  ] = await Promise.all([
    supabase.from("invoices").select("id,total,status,created_at,due_date").eq("business_id", business.id),
    supabase.from("expenses").select("id,amount,date").eq("business_id", business.id),
    supabase.from("payments").select("id,amount,date").eq("business_id", business.id),
    supabase.from("customers").select("id,name").eq("business_id", business.id),
  ]);

  const totalRevenue = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const outstandingInvoices = (invoices || []).filter(i => ["sent","overdue"].includes(i.status));
  const outstandingAmount = outstandingInvoices.reduce((s, i) => s + Number(i.total), 0);

  return (
    <DashboardClient
      business={business}
      stats={{
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        outstandingAmount,
        outstandingCount: outstandingInvoices.length,
        customerCount: (customers || []).length,
      }}
      recentInvoices={(invoices || []).slice(0, 5)}
      recentPayments={(payments || []).slice(0, 5)}
    />
  );
}
