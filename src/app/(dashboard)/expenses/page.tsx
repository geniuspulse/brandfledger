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
import { Plus, Search, Pencil, Trash2, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Business } from "@/types";

const categories = ["Office Supplies", "Travel", "Software", "Marketing", "Utilities", "Rent", "Salaries", "Equipment", "Food & Entertainment", "Other"];
const methods = ["Cash", "Credit Card", "Bank Transfer", "Mobile Money", "Other"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", category: "", amount: "", date: new Date().toISOString().split("T")[0], vendor: "", notes: "", payment_method: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const { data } = await supabase.from("expenses").select("*").eq("business_id", biz.id).order("date", { ascending: false });
    setExpenses(data ?? []);
  }

  function openAdd() { setEditing(null); setForm({ description: "", category: "", amount: "", date: new Date().toISOString().split("T")[0], vendor: "", notes: "", payment_method: "" }); setOpen(true); }
  function openEdit(e: Expense) { setEditing(e); setForm({ description: e.description, category: e.category, amount: String(e.amount), date: e.date, vendor: e.vendor ?? "", notes: e.notes ?? "", payment_method: "" }); setOpen(true); }

  async function handleSave() {
    if (!form.description || !form.amount || !business) return;
    setLoading(true);
    const supabase = createClient();
    const payload = { ...form, amount: parseFloat(form.amount), business_id: business.id };
    if (editing) {
      await supabase.from("expenses").update(payload).eq("id", editing.id);
      toast({ title: "Expense updated" });
    } else {
      await supabase.from("expenses").insert(payload);
      toast({ title: "Expense recorded" });
    }
    setOpen(false); setLoading(false); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    toast({ title: "Expense deleted" }); loadData();
  }

  const filtered = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.vendor?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <Header title="Expenses" description="Track your business spending" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Description *</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(p => ({ ...p, payment_method: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Saving..." : editing ? "Update" : "Add Expense"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{filtered.length} expense{filtered.length !== 1 ? "s" : ""}</span>
              <span className="font-semibold text-destructive">{formatCurrency(total, business?.currency)}</span>
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Receipt className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No expenses yet. Start tracking your spending!</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(e => (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
                      <Receipt className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.category}{e.vendor ? ` · ${e.vendor}` : ""} · {formatDate(e.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-destructive">{formatCurrency(e.amount, business?.currency)}</span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
