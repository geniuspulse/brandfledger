"use client";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Brandfledger</span>
        </Link>
        <div>
          <blockquote className="text-2xl font-semibold leading-snug mb-4">
            "Brandfledger turned a 3-hour accounting nightmare into a 20-minute job."
          </blockquote>
          <p className="text-primary-foreground/70 text-sm">— Chisomo M., Freelance Designer</p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          {[["2,400+", "Businesses"], ["$12M+", "Invoiced"], ["99.9%", "Uptime"]].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold">{v}</div>
              <div className="text-sm text-primary-foreground/70">{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Right form panel */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Brandfledger</span>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
