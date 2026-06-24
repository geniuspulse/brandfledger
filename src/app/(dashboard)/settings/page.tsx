"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Building2, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "MWK", "ZAR", "NGN", "KES", "GHS"];

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [bizForm, setBizForm] = useState({ name: "", email: "", phone: "", address: "", website: "", currency: "USD", invoice_prefix: "INV" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    setProfile({ full_name: user.user_metadata?.full_name ?? "", email: user.email ?? "" });
    const { data: biz } = await sb.from("businesses").select("*").eq("owner_id", user.id).single();
    if (biz) { setBusiness(biz); setBizForm({ name: biz.name, email: biz.email ?? "", phone: biz.phone ?? "", address: biz.address ?? "", website: biz.website ?? "", currency: biz.currency, invoice_prefix: biz.invoice_prefix }); }
  }

  async function saveBusiness() {
    if (!business) return;
    setLoading(true);
    const sb = createClient();
    const { error } = await sb.from("businesses").update({ ...bizForm, updated_at: new Date().toISOString() }).eq("id", business.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Business settings saved" });
    setLoading(false);
  }

  async function saveProfile() {
    setLoading(true);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ data: { full_name: profile.full_name } });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
    setLoading(false);
  }

  async function changePassword() {
    if (passwords.newPass !== passwords.confirm) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    if (passwords.newPass.length < 8) { toast({ title: "Password too short", description: "Minimum 8 characters", variant: "destructive" }); return; }
    setPwLoading(true);
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: passwords.newPass });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password changed" }); setPasswords({ current: "", newPass: "", confirm: "" }); }
    setPwLoading(false);
  }

  return (
    <div>
      <Header title="Settings" description="Manage your business and account settings" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Business settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Business Profile</CardTitle></div>
            <CardDescription>Update your business information shown on invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label>Business name *</Label><Input value={bizForm.name} onChange={e => setBizForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Business email</Label><Input type="email" value={bizForm.email} onChange={e => setBizForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={bizForm.phone} onChange={e => setBizForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Address</Label><Input value={bizForm.address} onChange={e => setBizForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Website</Label><Input placeholder="https://" value={bizForm.website} onChange={e => setBizForm(p => ({ ...p, website: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Invoice prefix</Label><Input placeholder="INV" value={bizForm.invoice_prefix} onChange={e => setBizForm(p => ({ ...p, invoice_prefix: e.target.value.toUpperCase() }))} /></div>
              <div className="col-span-2 space-y-2"><Label>Currency</Label><Select value={bizForm.currency} onValueChange={v => setBizForm(p => ({ ...p, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button onClick={saveBusiness} disabled={loading || !bizForm.name}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save business settings
            </Button>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Your Profile</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email address</Label><Input type="email" value={profile.email} disabled className="bg-muted" /></div>
            <Button onClick={saveProfile} disabled={loading}><Save className="mr-2 h-4 w-4" />Save profile</Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-muted-foreground" /><CardTitle className="text-base">Change Password</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>New password</Label><Input type="password" placeholder="8+ characters" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} /></div>
            <Button onClick={changePassword} disabled={pwLoading || !passwords.newPass} variant="outline">
              {pwLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}Change password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
