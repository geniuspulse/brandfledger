"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { Business } from "@/types";

export default function ReportsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [period, setPeriod] = useState("12");
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, profit: 0 });

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: biz } = await supabase.from("businesses").select("*").eq("owner_id", user!.id).single();
    setBusiness(biz);

    const months = parseInt(period);
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months + 1);
    fromDate.setDate(1);

    const [{ data: invoices }, { data: expenses }] = await Promise.all([
      supabase.from("invoices").select("total, status, issue_date").eq("business_id", biz.id).eq("status", "paid").gte("issue_date", fromDate.toISOString()),
      supabase.from("expenses").select("amount, date").eq("business_id", biz.id).gte("date", fromDate.toISOString()),
    ]);

    const monthMap: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - 1 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap[key] = { month: label, revenue: 0, expenses: 0, profit: 0 };
    }

    invoices?.forEach(inv => {
      const key = inv.issue_date.slice(0, 7);
      if (monthMap[key]) monthMap[key].revenue += inv.total;
    });
    expenses?.forEach(exp => {
      const key = exp.date.slice(0, 7);
      if (monthMap[key]) monthMap[key].expenses += exp.amount;
    });

    const chartData = Object.values(monthMap).map(m => ({ ...m, profit: m.revenue - m.expenses }));
    setData(chartData);
    setSummary({
      revenue: chartData.reduce((s, m) => s + m.revenue, 0),
      expenses: chartData.reduce((s, m) => s + m.expenses, 0),
      profit: chartData.reduce((s, m) => s + m.profit, 0),
    });
  }

  return (
    <div>
      <Header title="Reports" description="Financial overview and analytics" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Revenue", value: summary.revenue, icon: TrendingUp, color: "text-green-600" },
            { label: "Total Expenses", value: summary.expenses, icon: TrendingDown, color: "text-red-500" },
            { label: "Net Profit", value: summary.profit, icon: DollarSign, color: summary.profit >= 0 ? "text-green-600" : "text-red-500" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{formatCurrency(stat.value, business?.currency)}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Revenue vs Expenses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, business?.currency)} />
                <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v, business?.currency)} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
