export type UserRole = "owner" | "admin" | "member" | "viewer";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";

export interface Business {
  id: string;
  name: string;
  owner_id: string;
  logo_url?: string;
  currency: string;
  invoice_prefix: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  total_invoiced: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  customers?: Customer;
}

export interface Payment {
  id: string;
  business_id: string;
  invoice_id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
  created_at: string;
  invoices?: Invoice;
}

export interface Expense {
  id: string;
  business_id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  vendor?: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstandingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  recentTransactions: (Invoice | Expense)[];
}
