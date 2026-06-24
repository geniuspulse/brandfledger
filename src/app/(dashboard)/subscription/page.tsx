"use client";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Building2, Rocket } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for freelancers getting started",
    icon: Zap,
    features: ["5 invoices per month", "1 business profile", "Unlimited customers", "Basic reports", "PDF export"],
    current: true,
    cta: "Current plan",
    disabled: true,
  },
  {
    name: "Starter",
    price: "$12",
    period: "/month",
    description: "For growing small businesses",
    icon: Building2,
    features: ["Unlimited invoices", "3 business profiles", "Full reports & exports", "Team members (up to 3)", "Priority email support"],
    current: false,
    cta: "Upgrade to Starter",
    disabled: false,
    highlight: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For established businesses",
    icon: Rocket,
    features: ["Everything in Starter", "Unlimited businesses", "Unlimited team", "API access", "Custom invoice branding", "Dedicated support"],
    current: false,
    cta: "Upgrade to Pro",
    disabled: false,
  },
];

export default function SubscriptionPage() {
  return (
    <div>
      <Header title="Subscription" description="Manage your plan and billing" />
      <div className="p-6 space-y-6">
        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">You&apos;re on the <strong>Free plan</strong></p>
            <p className="text-sm text-muted-foreground">Upgrade to unlock unlimited invoices and more.</p>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Free</Badge>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card key={plan.name} className={plan.highlight ? "border-primary shadow-md" : ""}>
              {plan.highlight && <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-1.5 rounded-t-lg">Most popular</div>}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <div className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.disabled}>
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">All plans include a 14-day free trial. No credit card required for Free plan.</p>
      </div>
    </div>
  );
}
