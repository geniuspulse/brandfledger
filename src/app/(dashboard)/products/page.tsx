"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", unit: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data: biz } = await sb.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    if (!biz) return;
    const { data } = await sb.from("products").select("*").eq("business_id", biz.id).order("created_at", { ascending: false });
    setProducts(data ?? []);
  }

  function openAdd() { setEditing(null); setForm({ name: "", description: "", price: "", category: "", unit: "" }); setOpen(true); }
  function openEdit(p: any) { setEditing(p); setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category ?? "", unit: p.unit ?? "" }); setOpen(true); }

  async function handleSave() {
    if (!form.name || !business) return;
    setLoading(true);
    const sb = createClient();
    const data = { name: form.name, description: form.description, price: parseFloat(form.price) || 0, category: form.category, unit: form.unit };
    if (editing) { await sb.from("products").update(data).eq("id", editing.id); toast({ title: "Product updated" }); }
    else { await sb.from("products").insert({ ...data, business_id: business.id }); toast({ title: "Product added" }); }
    setOpen(false); setLoading(false); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const sb = createClient();
    await sb.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" }); loadData();
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Header title="Products & Services" description="Your product and service catalog"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Product</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Web design" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" /></div>
                  <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="hr, each, mo" /></div>
                </div>
                <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Services, Products..." /></div>
                <Button onClick={handleSave} disabled={loading || !form.name} className="w-full">{loading ? "Saving..." : editing ? "Update" : "Add Product"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">{search ? "No products match your search." : "Add products and services to use in invoices."}</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <Card key={p.id} className="group hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.category && <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>}
                  <p className="text-lg font-bold mt-2">{formatCurrency(p.price, business?.currency)}{p.unit && <span className="text-xs font-normal text-muted-foreground"> / {p.unit}</span>}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
