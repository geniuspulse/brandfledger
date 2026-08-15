"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  type: "transactions" | "customers" | "products" | "expenses" | "invoices";
  businessId?: string;
  onImported?: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function ImportExport({ type, businessId, onImported, className, size = "sm" }: Props) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const url = businessId
        ? `/api/data/export?type=${type}&business_id=${businessId}`
        : `/api/data/export?type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `export_${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(dlUrl);
      toast({ title: "Exported", description: "CSV file downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (businessId) formData.append("business_id", businessId);

      const res = await fetch("/api/data/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      toast({
        title: "Import complete",
        description: `${data.inserted} records imported${data.errors > 0 ? `, ${data.errors} skipped` : ""}.`,
      });
      onImported?.();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImport}
      />
      <Button
        size={size}
        variant="outline"
        className="rounded-full bg-card"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
        Export
      </Button>
      <Button
        size={size}
        variant="outline"
        className="rounded-full bg-card"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
      >
        {importing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
        Import
      </Button>
    </div>
  );
}
