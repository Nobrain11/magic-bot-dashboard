import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Wallet, History, Settings, Zap, TrendingUp, Menu, X } from "lucide-react";
import {
  useGetMarketStats,
  useGetBotStatus,
  getGetMarketStatsQueryKey,
  getGetBotStatusQueryKey,
} from "@workspace/api-client-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Activity },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function PriceTicker({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: market } = useGetMarketStats({
    query: { queryKey: getGetMarketStatsQueryKey(), refetchInterval: 5000 },
  });
  const { data: status } = useGetBotStatus({
    query: { queryKey: getGetBotStatusQueryKey(), refetchInterval: 5000 },
  });

  const price = market?.tokenPrice ?? 0;
  const mc = market?.marketCap ?? 0;
  const sol = market?.solPrice ?? 0;

  return (
    <div className="h-9 border-b border-border/60 bg-sidebar/90 backdrop-blur flex items-center justify-between px-3 md:px-5 shrink-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp size={12} className="text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono hidden sm:block">$MAGIC</span>
          <span className="text-xs font-black text-primary font-mono filter drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]">
            ${price > 0 ? price.toFixed(8) : "—"}
          </span>
        </div>

        <div className="w-px h-3 bg-border/60 hidden sm:block" />

        <div className="items-center gap-1.5 hidden sm:flex">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono">MC</span>
          <span className="text-[10px] font-bold text-foreground/80 font-mono">
            {mc > 0 ? `$${mc >= 1000 ? (mc / 1000).toFixed(1) + "k" : mc.toFixed(0)}` : "—"}
          </span>
        </div>

        <div className="w-px h-3 bg-border/60 hidden md:block" />

        <div className="items-center gap-1.5 hidden md:flex">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono">SOL</span>
          <span className="text-[10px] font-bold text-foreground/80 font-mono">
            ${sol > 0 ? sol.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            status?.running
              ? "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.7)] animate-pulse"
              : "bg-zinc-700"
          }`}
        />
        <span className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest hidden sm:block">
          {status?.running ? "Active" : "Offline"}
        </span>
        {status?.running && (status.totalActions ?? 0) > 0 && (
          <>
            <span className="w-px h-3 bg-border/60 hidden md:block" />
            <span className="text-[10px] text-muted-foreground/50 font-mono hidden md:block">
              {status.totalActions} actions
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full w-60 bg-sidebar">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-sm shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-primary leading-none">$MAGIC</h1>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.15em] mt-0.5">War Room</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors md:hidden p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon size={15} />
                <span className="text-[13px] tracking-wide">{item.label}</span>
                {isActive && <div className="ml-auto w-1 h-4 bg-primary-foreground/30 rounded-full" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/40">
        <div className="text-[9px] text-muted-foreground/40 text-center font-mono">
          <div className="truncate">Htg5ds…dpump</div>
          <div className="mt-0.5">Solana Mainnet</div>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 border-t border-border/60 backdrop-blur flex items-center justify-around px-2 py-2">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-sm transition-all cursor-pointer ${
                isActive ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              <item.icon size={18} />
              <span className="text-[8px] uppercase tracking-widest font-mono">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background dark text-foreground font-mono overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex border-r border-border/60 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full border-r border-border/60 shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Subtle background glows */}
        <div className="absolute top-0 left-[20%] w-[60%] h-[30%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-[10%] w-[40%] h-[25%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <PriceTicker onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-7 relative z-10 pb-20 md:pb-7">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
