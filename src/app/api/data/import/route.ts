import { NextResponse } from "next/server";
import { supabase, getDbUser } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getBusinessId(userId: string, requestedId?: string | null) {
  if (requestedId) {
    const { data } = await supabase.from("businesses").select("id").eq("id", requestedId).eq("owner_id", userId).maybeSingle();
    if (!data) return null;
    return requestedId;
  }
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const cookieId = cookieStore.get("activeBusinessId")?.value;
    if (cookieId) {
      const { data } = await supabase.from("businesses").select("id").eq("id", cookieId).eq("owner_id", userId).maybeSingle();
      if (data) return cookieId;
    }
  } catch {}
  const { data } = await supabase.from("businesses").select("id").eq("owner_id", userId).order("created_at").limit(1).maybeSingle();
  return data?.id ?? null;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') {
        if (inQuotes && lines[i][j + 1] === '"') { current += '"'; j++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      rows.push(row);
    }
  }
  return rows;
}

export async function POST(request: Request) {
  try {
    const user = getDbUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const type = formData.get("type") as string;
    const file = formData.get("file") as File;
    const businessIdParam = formData.get("business_id") as string | null;

    if (!file || !type) return NextResponse.json({ error: "File and type required" }, { status: 400 });

    const businessId = await getBusinessId(user.userId, businessIdParam);
    if (!businessId) return NextResponse.json({ error: "No business found" }, { status: 404 });

    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });

    let inserted = 0;
    let errors = 0;

    if (type === "customers") {
      for (const row of rows) {
        const name = row["name"]?.trim();
        if (!name) { errors++; continue; }
        const { error } = await supabase.from("customers").insert({
          business_id: businessId,
          name,
          email: row["email"] || null,
          phone: row["phone"] || null,
          address: row["address"] || null,
          notes: row["notes"] || null,
          total_invoiced: 0,
        });
        if (error) errors++; else inserted++;
      }
    } else if (type === "products") {
      for (const row of rows) {
        const name = row["name"]?.trim();
        if (!name) { errors++; continue; }
        const price = parseFloat(row["price"]) || 0;
        const cost = parseFloat(row["cost"]) || 0;
        const profitMargin = price > 0 ? ((price - cost) / price * 100) : 0;
        const { error } = await supabase.from("products").insert({
          business_id: businessId,
          name,
          description: row["description"] || null,
          price,
          cost,
          profit_margin: profitMargin,
          unit: row["unit"] || "hr",
          is_active: true,
        });
        if (error) errors++; else inserted++;
      }
    } else if (type === "transactions" || type === "expenses") {
      for (const row of rows) {
        const description = row["description"]?.trim();
        const amount = parseFloat(row["amount"]) || 0;
        if (!description || amount <= 0) { errors++; continue; }
        const txType = type === "expenses" ? "expense" : (row["type"]?.trim() || "income");
        const costAmount = parseFloat(row["cost"] || row["cost_amount"]) || 0;
        const profit = txType === "income" ? amount - costAmount : 0;
        const dateStr = row["date"] ? new Date(row["date"]).toISOString() : new Date().toISOString();
        const { error } = await supabase.from("transactions").insert({
          business_id: businessId,
          type: txType,
          client_name: row["client"] || row["client_name"] || null,
          vendor_name: row["vendor"] || row["vendor_name"] || null,
          description,
          amount,
          cost_amount: costAmount,
          profit,
          payment_method: row["payment_method"] || "cash",
          date: dateStr,
        });
        if (error) errors++; else inserted++;
      }
    } else if (type === "invoices") {
      for (const row of rows) {
        const customerName = row["customer"] || row["client"] || row["client_name"]?.trim();
        const total = parseFloat(row["total"] || row["amount"]) || 0;
        if (!customerName || total <= 0) { errors++; continue; }
        const status = row["status"]?.trim().toLowerCase() || "draft";
        const { data: customer } = await supabase.from("customers")
          .select("id").eq("business_id", businessId).eq("name", customerName).maybeSingle();
        const invNumber = row["invoice_number"] || `INV-${Date.now()}`;
        const { error } = await supabase.from("invoices").insert({
          business_id: businessId,
          customer_id: customer?.id || null,
          invoice_number: invNumber,
          total,
          status,
          issue_date: row["issue_date"] || new Date().toISOString(),
          due_date: row["due_date"] || null,
        });
        if (error) errors++; else inserted++;
      }
    } else {
      return NextResponse.json({ error: "Unknown import type" }, { status: 400 });
    }

    return NextResponse.json({ inserted, errors, total: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
