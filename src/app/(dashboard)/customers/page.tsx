"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Business } from "@/types";

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const { data } = await supabase.from("customers").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
    setCustomers(data ?? []);
  }

  function openAdd() { setEditing(null); setForm({ name: "", email: "", phone: "", address: "", notes: "" }); setOpen(true); }
  function openEdit(c: Customer) { setEditing(c); setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", notes: c.notes ?? "" }); setOpen(true); }

  async function handleSave() {
    if (!form.name || !business) return;
    setLoading(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("customers").update(form).eq("id", editing.id);
      toast({ title: "Customer updated" });
    } else {
      await supabase.from("customers").insert({ ...form, business_id: business.id, total_invoiced: 0 });
      toast({ title: "Customer added" });
    }
    setOpen(false); setLoading(false); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    const supabase = createClient();
    await supabase.from("customers").delete().eq("id", id);
    toast({ title: "Customer deleted" });
    loadData();
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Customers" description="Manage your customer database" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                {(["name", "email", "phone", "address", "notes"] as const).map(field => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field} className="capitalize">{field}{field === "name" ? " *" : ""}</Label>
                    <Input id={field} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} required={field === "name"} />
                  </div>
                ))}
                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {loading ? "Saving..." : editing ? "Update" : "Add Customer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{search ? "No customers match your search." : "No customers yet. Add your first customer!"}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{formatCurrency(c.total_invoiced, business?.currency)}</p>
                      <p className="text-xs text-muted-foreground">total invoiced</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
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
