"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Trash2, Printer, Mail, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, calculateInvoiceTotals } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Customer, Product, Business, InvoiceItem } from "@/types";

const statuses = ["draft", "sent", "paid", "overdue"] as const;

export default function InvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    tax_rate: "0",
    items: [{ name: "", description: "", quantity: 1, unit_price: 0, total: 0 }] as InvoiceItem[],
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const [{ data: invs }, { data: custs }, { data: prods }] = await Promise.all([
      supabase.from("invoices").select("*, customers(name, email)").eq("business_id", biz.id).order("created_at", { ascending: false }),
      supabase.from("customers").select("*").eq("business_id", biz.id).order("name"),
      supabase.from("products").select("*").eq("business_id", biz.id).order("name"),
    ]);
    setInvoices(invs ?? []);
    setCustomers(custs ?? []);
    setProducts(prods ?? []);
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    setForm(prev => {
      const items = [...prev.items];
      const item = { ...items[idx], [field]: value } as InvoiceItem;
      item.total = item.quantity * item.unit_price;
      items[idx] = item;
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, { name: "", description: "", quantity: 1, unit_price: 0, total: 0 }] }));
  }

  function removeItem(idx: number) {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }

  function applyProduct(idx: number, productId: string) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], name: prod.name, description: prod.description ?? "", unit_price: prod.price, total: items[idx].quantity * prod.price };
      return { ...prev, items };
    });
  }

  const { subtotal, taxAmount, total } = calculateInvoiceTotals(form.items, parseFloat(form.tax_rate) || 0);

  async function handleSave() {
    if (!form.customer_id || form.items.length === 0 || !business) return;
    setLoading(true);
    const supabase = createClient();
    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("business_id", business.id);
    const invoice_number = `${business.invoice_prefix}-${String((count ?? 0) + 1).padStart(5, "0")}`;
    const { error } = await supabase.from("invoices").insert({
      business_id: business.id,
      customer_id: form.customer_id,
      invoice_number,
      status: "draft",
      issue_date: form.issue_date,
      due_date: form.due_date || form.issue_date,
      items: form.items,
      subtotal,
      tax_rate: parseFloat(form.tax_rate) || 0,
      tax_amount: taxAmount,
      total,
      notes: form.notes,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Invoice ${invoice_number} created` }); }
    setOpen(false); setLoading(false); loadData();
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("invoices").update({ status }).eq("id", id);
    toast({ title: `Status updated to ${status}` });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice?")) return;
    const supabase = createClient();
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Invoice deleted" });
    loadData();
  }

  function openEmailDialog(inv: Invoice) {
    setEmailInvoice(inv);
    setEmailOpen(true);
  }

  async function handleSendEmail() {
    if (!emailInvoice || !business) return;
    const customer = (emailInvoice as any).customers;
    if (!customer?.email) {
      toast({ title: "No email address", description: "This customer has no email on file.", variant: "destructive" });
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: emailInvoice.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to send");
      if (emailInvoice.status === "draft") {
        const supabase = createClient();
        await supabase.from("invoices").update({ status: "sent" }).eq("id", emailInvoice.id);
      }
      toast({ title: "Invoice emailed!", description: `Sent to ${customer.email}` });
      setEmailOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Error sending email", description: err.message, variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  }

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv as any).customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Invoices" description="Create and manage invoices" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select value={form.customer_id} onValueChange={v => setForm(p => ({ ...p, customer_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input type="number" min="0" max="100" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                  </div>
                  <div className="space-y-2">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-2">
                        <div className="col-span-4">
                          <Select onValueChange={v => applyProduct(idx, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick product" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input className="mt-1 h-8 text-xs" placeholder="Item name" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-8 text-xs" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-3">
                          <Input className="h-8 text-xs" type="number" placeholder="Unit price" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-2 flex items-center h-8">
                          <span className="text-xs font-medium">{formatCurrency(item.total, business?.currency)}</span>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="text-right space-y-1 text-sm">
                    <div className="flex gap-8"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal, business?.currency)}</span></div>
                    <div className="flex gap-8"><span className="text-muted-foreground">Tax ({form.tax_rate}%)</span><span>{formatCurrency(taxAmount, business?.currency)}</span></div>
                    <div className="flex gap-8 font-bold text-base border-t pt-1"><span>Total</span><span>{formatCurrency(total, business?.currency)}</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Payment terms, thank you note..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading || !form.customer_id}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Invoice
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No invoices yet. Create your first invoice!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium">{inv.invoice_number}</div>
                        <div className="text-sm text-muted-foreground">{(inv as any).customers?.name ?? "—"}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{formatCurrency(inv.total, business?.currency)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(inv.issue_date)}</div>
                    </div>
                    <div className="shrink-0">
                      <Select value={inv.status} onValueChange={v => updateStatus(inv.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {statuses.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(inv.status === "draft" || inv.status === "sent") && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Email invoice" onClick={() => openEmailDialog(inv)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Print" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Email Invoice</DialogTitle></DialogHeader>
          {emailInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm bg-muted/30">
                <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{emailInvoice.invoice_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{(emailInvoice as any).customers?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="text-primary">{(emailInvoice as any).customers?.email ?? "No email on file"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatCurrency(emailInvoice.total, business?.currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{formatDate(emailInvoice.due_date)}</span></div>
              </div>
              <p className="text-sm text-muted-foreground">
                The customer will receive a professional email with full invoice details.
                {emailInvoice.status === "draft" && " Status will be updated to Sent."}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={emailLoading || !(emailInvoice as any).customers?.email}>
                  {emailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
