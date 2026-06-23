"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Payment, Invoice, Business } from "@/types";

const methods = ["Cash", "Credit Card", "Bank Transfer", "Mobile Money", "Cheque", "Other"];

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ invoice_id: "", amount: "", date: new Date().toISOString().split("T")[0], method: "", reference: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const [{ data: pays }, { data: invs }] = await Promise.all([
      supabase.from("payments").select("*, invoices(invoice_number, total, customers(name))").eq("business_id", biz.id).order("date", { ascending: false }),
      supabase.from("invoices").select("*, customers(name)").eq("business_id", biz.id).in("status", ["sent", "overdue"]),
    ]);
    setPayments(pays ?? []);
    setInvoices(invs ?? []);
  }

  async function handleSave() {
    if (!form.invoice_id || !form.amount || !business) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("payments").insert({ ...form, amount: parseFloat(form.amount), business_id: business.id });
    const inv = invoices.find(i => i.id === form.invoice_id);
    if (inv && parseFloat(form.amount) >= inv.total) {
      await supabase.from("invoices").update({ status: "paid" }).eq("id", form.invoice_id);
    }
    toast({ title: "Payment recorded" });
    setOpen(false); setLoading(false); loadData();
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <Header title="Payments" description="Track payments received" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Invoice *</Label>
                  <Select value={form.invoice_id} onValueChange={v => { setForm(p => ({ ...p, invoice_id: v })); const inv = invoices.find(i => i.id === v); if (inv) setForm(p => ({ ...p, invoice_id: v, amount: String(inv.total) })); }}>
                    <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                    <SelectContent>{invoices.map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — {(i as any).customers?.name} ({formatCurrency(i.total, business?.currency)})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Payment Method</Label>
                  <Select value={form.method} onValueChange={v => setForm(p => ({ ...p, method: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Reference</Label><Input value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} /></div>
                <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Saving..." : "Record Payment"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {payments.length > 0 && (
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Total received</span>
              <span className="font-bold text-green-700">{formatCurrency(total, business?.currency)}</span>
            </CardContent>
          </Card>
        )}

        {payments.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No payments recorded yet.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{(p as any).invoices?.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{p.method} · {formatDate(p.date)}{p.reference ? ` · Ref: ${p.reference}` : ""}</p>
                  </div>
                  <span className="font-semibold text-green-700">{formatCurrency(p.amount, business?.currency)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
