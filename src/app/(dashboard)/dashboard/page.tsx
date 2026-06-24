import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return <DashboardClient business={null} stats={null} setupStatus={{ hasBusiness: false, hasCustomer: false, hasProduct: false, hasInvoice: false }} />;
  }

  const [
    { data: invoices },
    { data: expenses },
    { data: customers },
  ] = await Promise.all([
    supabase.from("invoices").select("total, status, created_at, id, invoice_number").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("expenses").select("amount, date").eq("business_id", business.id),
    supabase.from("customers").select("id").eq("business_id", business.id),
  ]);

  const paidInvoices = (invoices ?? []).filter(i => i.status === "paid");
  const revenue = paidInvoices.reduce((s, i) => s + i.total, 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const outstandingInvoices = (invoices ?? []).filter(i => i.status === "sent" || i.status === "overdue");
  const outstandingAmount = outstandingInvoices.reduce((s, i) => s + i.total, 0);

  const { data: hasCustomer } = await supabase.from("customers").select("id").eq("business_id", business.id).limit(1);
  const { data: hasProduct } = await supabase.from("products").select("id").eq("business_id", business.id).limit(1);
  const { data: hasInvoice } = await supabase.from("invoices").select("id").eq("business_id", business.id).limit(1);

  return (
    <DashboardClient
      business={business}
      stats={{
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
        outstandingAmount,
        outstandingCount: outstandingInvoices.length,
        customerCount: (customers ?? []).length,
      }}
      setupStatus={{
        hasBusiness: true,
        hasCustomer: (hasCustomer ?? []).length > 0,
        hasProduct: (hasProduct ?? []).length > 0,
        hasInvoice: (hasInvoice ?? []).length > 0,
      }}
      recentInvoices={(invoices ?? []).slice(0, 5)}
    />
  );
}
