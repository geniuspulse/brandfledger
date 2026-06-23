import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function generateInvoiceNumber(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export function calculateInvoiceTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number
) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}
