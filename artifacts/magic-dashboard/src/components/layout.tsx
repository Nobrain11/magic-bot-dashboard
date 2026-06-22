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
  const { data: market } = useGetMarketStats({ query: { queryKey: getGetMarketStatsQueryKey(), refetchInterval: 5000 } });
  const { data: status } = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), refetchInterval: 5000 } });

  const price = market?.tokenPrice ?? 0;
  const mc = market?.marketCap ?? 0;
  const sol = market?.solPrice ?? 0;

  return (
    <div className="h-10 border-b border-border bg-sidebar/80 backdrop-blur flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <TrendingUp size={13} className="text-primary shrink-0" />
          <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-mono hidden sm:block">$MAGIC</span>
          <span className="text-xs md:text-sm font-black text-primary font-mono tracking-tight filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
            ${price > 0 ? price.toFixed(8) : "—"}
          </span>
        </div>

        <div className="w-px h-4 bg-border hidden sm:block" />
        <div className="items-center gap-1.5 hidden sm:flex">
          <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-mono">MC</span>
          <span className="text-[10px] md:text-xs font-bold text-foreground font-mono">
            {mc > 0 ? `$${mc >= 1000 ? (mc / 1000).toFixed(1) + "k" : mc.toFixed(0)}` : "—"}
          </span>
        </div>

        <div className="w-px h-4 bg-border hidden md:block" />
        <div className="items-center gap-1.5 hidden md:flex">
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">SOL</span>
          <span className="text-xs font-bold text-foreground font-mono">
            ${sol > 0 ? sol.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            status?.running
              ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)] animate-pulse"
              : "bg-zinc-600"
          }`}
        />
        <span className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-widest hidden sm:block">
          {status?.running ? "Active" : "Offline"}
        </span>
        {status?.running && (status.totalActions ?? 0) > 0 && (
          <>
            <span className="w-px h-3 bg-border hidden md:block" />
            <span className="text-xs text-muted-foreground font-mono hidden md:block">
              {status?.totalActions ?? 0} actions
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
    <div className="flex flex-col h-full w-64 bg-sidebar">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded border border-primary/20 shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">$MAGIC</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">War Room</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon size={17} />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-[9px] text-muted-foreground text-center font-mono leading-relaxed">
          <div className="text-foreground/60 truncate">Htg5ds...dpump</div>
          <div className="mt-0.5 opacity-40">Solana Mainnet</div>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location] = useLocation();
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-border flex items-center justify-around px-2 py-2 safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded transition-all cursor-pointer ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[9px] uppercase tracking-widest font-mono">{item.label}</span>
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
      <div className="hidden md:flex border-r border-border shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-10 flex h-full border-r border-border shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top price ticker */}
        <PriceTicker onMenuClick={() => setMobileOpen(true)} />

        {/* Scrollable content — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative z-10 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
