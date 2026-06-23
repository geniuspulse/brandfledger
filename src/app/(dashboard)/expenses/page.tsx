// UPDATED: src/app/(dashboard)/expenses/page.tsx
// Changes: Added receipt file upload (image/PDF) stored in Supabase Storage bucket "receipts"

"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Receipt, Paperclip, ExternalLink, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Expense, Business } from "@/types";

const categories = ["Office Supplies", "Travel", "Software", "Marketing", "Utilities", "Rent", "Salaries", "Equipment", "Food & Entertainment", "Other"];

export default function ExpensesPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    notes: "",
    receipt_url: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const { data } = await supabase.from("expenses").select("*").eq("business_id", biz.id).order("date", { ascending: false });
    setExpenses(data ?? []);
  }

  function openAdd() {
    setEditing(null);
    setReceiptFile(null);
    setForm({ description: "", category: "", amount: "", date: new Date().toISOString().split("T")[0], vendor: "", notes: "", receipt_url: "" });
    setOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setReceiptFile(null);
    setForm({ description: e.description, category: e.category, amount: String(e.amount), date: e.date, vendor: e.vendor ?? "", notes: e.notes ?? "", receipt_url: e.receipt_url ?? "" });
    setOpen(true);
  }

  async function uploadReceipt(file: File, businessId: string): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${businessId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function handleSave() {
    if (!form.description || !form.amount || !business) return;
    setLoading(true);
    try {
      let receipt_url = form.receipt_url;
      if (receiptFile) {
        setUploadingReceipt(true);
        receipt_url = await uploadReceipt(receiptFile, business.id);
        setUploadingReceipt(false);
      }

      const supabase = createClient();
      const payload = {
        description: form.description,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        vendor: form.vendor,
        notes: form.notes,
        receipt_url,
        business_id: business.id,
      };

      if (editing) {
        await supabase.from("expenses").update(payload).eq("id", editing.id);
        toast({ title: "Expense updated" });
      } else {
        await supabase.from("expenses").insert(payload);
        toast({ title: "Expense recorded" });
      }
      setOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploadingReceipt(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", id);
    toast({ title: "Expense deleted" });
    loadData();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  }

  const filtered = expenses.filter(exp =>
    exp.description.toLowerCase().includes(search.toLowerCase()) ||
    exp.category.toLowerCase().includes(search.toLowerCase()) ||
    (exp.vendor ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <Header title="Expenses" description="Track your business expenses" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatCurrency(total, business?.currency)}</span>
          </div>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(exp => (
              <Card key={exp.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{exp.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {exp.category}{exp.vendor ? ` · ${exp.vendor}` : ""} · {formatDate(exp.date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-red-600">{formatCurrency(exp.amount, business?.currency)}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {exp.receipt_url && (
                        <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View receipt">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(exp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(exp.id)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. AWS monthly bill" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} placeholder="Vendor name" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
            <div className="space-y-2">
              <Label>Receipt</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="shrink-0">
                  <Paperclip className="h-4 w-4 mr-2" />
                  {receiptFile ? receiptFile.name : form.receipt_url ? "Change receipt" : "Attach receipt"}
                </Button>
                {form.receipt_url && !receiptFile && (
                  <a href={form.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate">View current</a>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
              {receiptFile && <p className="text-xs text-muted-foreground">Ready to upload: {receiptFile.name}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading || !form.description || !form.amount}>
                {(loading || uploadingReceipt) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingReceipt ? "Uploading..." : editing ? "Save Changes" : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
