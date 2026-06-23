"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Product, Business } from "@/types";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", unit: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    const { data } = await supabase.from("products").select("*").eq("business_id", biz.id).order("name");
    setProducts(data ?? []);
  }

  function openAdd() { setEditing(null); setForm({ name: "", description: "", price: "", category: "", unit: "" }); setOpen(true); }
  function openEdit(p: Product) { setEditing(p); setForm({ name: p.name, description: p.description ?? "", price: String(p.price), category: p.category ?? "", unit: p.unit ?? "" }); setOpen(true); }

  async function handleSave() {
    if (!form.name || !form.price || !business) return;
    setLoading(true);
    const supabase = createClient();
    const payload = { ...form, price: parseFloat(form.price), business_id: business.id };
    if (editing) {
      await supabase.from("products").update(payload).eq("id", editing.id);
      toast({ title: "Product updated" });
    } else {
      await supabase.from("products").insert(payload);
      toast({ title: "Product added" });
    }
    setOpen(false); setLoading(false); loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Product deleted" }); loadData();
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Products & Services" description="Manage your product catalog" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                {[
                  { field: "name", label: "Name *" },
                  { field: "description", label: "Description" },
                  { field: "price", label: "Price *", type: "number" },
                  { field: "category", label: "Category" },
                  { field: "unit", label: "Unit (e.g. hr, piece)" },
                ].map(({ field, label, type }) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{label}</Label>
                    <Input id={field} type={type ?? "text"} value={form[field as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
                  </div>
                ))}
                <Button onClick={handleSave} disabled={loading} className="w-full">
                  {loading ? "Saving..." : editing ? "Update" : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No products yet. Add your first product or service!</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{p.name}</p>
                      {p.category && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{p.category}</span>}
                      {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatCurrency(p.price, business?.currency)}</span>
                    {p.unit && <span className="text-xs text-muted-foreground">per {p.unit}</span>}
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
