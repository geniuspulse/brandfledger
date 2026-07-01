"use client";
import { useRouter, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const options = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "all_time", label: "All Time" },
];

export function PeriodSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select value={value} onValueChange={(v) => router.push(`${pathname}?period=${v}`)}>
      <SelectTrigger className="w-auto min-w-[120px] h-9 rounded-full bg-card text-xs font-medium gap-1.5 shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
