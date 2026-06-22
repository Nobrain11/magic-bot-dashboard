import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, Wallet, History, Settings, Zap } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/wallets", label: "Wallets", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background dark text-foreground font-mono">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-sidebar">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded border border-primary/20">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">$MAGIC</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">War Room</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <div className="font-bold text-foreground">Htg5ds...dpump</div>
            <div className="mt-1 opacity-50">Solana Network</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <main className="flex-1 overflow-auto p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
