// NEW FILE: src/app/(dashboard)/subscription/page.tsx
// Subscription / billing page wired to the subscriptions table

"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Building2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Business, SubscriptionPlan } from "@/types";

interface PlanFeature { text: string; included: boolean }

const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: number;
  description: string;
  icon: React.ElementType;
  features: PlanFeature[];
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    icon: Zap,
    features: [
      { text: "1 business workspace", included: true },
      { text: "Up to 10 customers", included: true },
      { text: "Up to 20 invoices/month", included: true },
      { text: "Basic reports", included: true },
      { text: "Team members", included: false },
      { text: "Receipt uploads", included: false },
      { text: "Invoice email delivery", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9,
    description: "For freelancers and solo operators",
    icon: Star,
    highlight: true,
    features: [
      { text: "1 business workspace", included: true },
      { text: "Unlimited customers", included: true },
      { text: "Unlimited invoices", included: true },
      { text: "Advanced reports + CSV export", included: true },
      { text: "Up to 3 team members", included: true },
      { text: "Receipt uploads", included: true },
      { text: "Invoice email delivery", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "For growing businesses",
    icon: Building2,
    features: [
      { text: "Up to 5 business workspaces", included: true },
      { text: "Unlimited customers", included: true },
      { text: "Unlimited invoices", included: true },
      { text: "Advanced reports + CSV export", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Receipt uploads", included: true },
      { text: "Invoice email delivery", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    description: "Custom solutions for large teams",
    icon: Rocket,
    features: [
      { text: "Unlimited business workspaces", included: true },
      { text: "Unlimited everything", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantee", included: true },
      { text: "White-label option", included: true },
      { text: "Invoice email delivery", included: true },
      { text: "24/7 priority support", included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>("free");
  const [upgrading, setUpgrading] = useState<SubscriptionPlan | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);
    if (biz) {
      const { data: sub } = await supabase.from("subscriptions").select("plan").eq("business_id", biz.id).single();
      if (sub) setCurrentPlan(sub.plan as SubscriptionPlan);
    }
  }

  async function handleUpgrade(planId: SubscriptionPlan) {
    if (planId === currentPlan) return;
    if (!business) return;
    setUpgrading(planId);

    // In production: redirect to Stripe checkout here
    // For now: update the subscriptions table directly (simulated upgrade)
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.from("subscriptions").select("id").eq("business_id", business.id).single();

      if (existing) {
        await supabase.from("subscriptions").update({ plan: planId, updated_at: new Date().toISOString() }).eq("business_id", business.id);
      } else {
        await supabase.from("subscriptions").insert({ business_id: business.id, plan: planId, status: "active" });
      }

      setCurrentPlan(planId);
      toast({ title: `Upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`, description: planId === "free" ? "Downgraded successfully." : "Your plan has been activated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  }

  return (
    <div>
      <Header title="Subscription" description="Manage your plan and billing" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Current plan:</p>
          <Badge className="capitalize text-sm px-3 py-1">{currentPlan}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            return (
              <Card key={plan.id} className={`relative flex flex-col ${plan.highlight ? "ring-2 ring-primary" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f.text} className={`flex items-start gap-2 text-sm ${f.included ? "" : "opacity-40"}`}>
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${f.included ? "text-green-500" : "text-muted-foreground"}`} />
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    variant={isCurrentPlan ? "secondary" : plan.highlight ? "default" : "outline"}
                    disabled={isCurrentPlan || upgrading !== null}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? "Processing..." : isCurrentPlan ? "Current Plan" : plan.price === 0 ? "Downgrade" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          All prices in USD. Cancel anytime. Payment processing powered by Stripe.
        </p>
      </div>
    </div>
  );
}
