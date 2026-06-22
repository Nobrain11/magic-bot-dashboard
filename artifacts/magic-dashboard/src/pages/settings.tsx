import React, { useEffect, useRef } from "react";
import {
  useGetBotConfig,
  useUpdateBotConfig,
  useGetBotStatus,
  useStartBot,
  useStopBot,
  useGetBotLogs,
  getGetBotStatusQueryKey,
  getGetBotConfigQueryKey,
  getGetBotLogsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Square, Zap, Shield, Ghost } from "lucide-react";

type StrategyMode = "moon" | "balanced" | "stealth";

const STRATEGIES: {
  id: StrategyMode;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  badge: string;
  description: string;
  params: {
    sellProbability: number;
    intervalSeconds: number;
    activeBuyers: number;
    activeSellers: number;
    rotateEveryNBuys: number;
  };
}[] = [
  {
    id: "moon",
    label: "Moon Protocol",
    subtitle: "Maximum aggression",
    icon: Zap,
    color: "text-yellow-400",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.25)]",
    badge: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    description:
      "Heavy buy pressure, minimal sells. Designed to push price and volume hard toward the target MC. 80% buy bias, fast 15s cycles, 8 active buyers.",
    params: {
      sellProbability: 0.2,
      intervalSeconds: 15,
      activeBuyers: 8,
      activeSellers: 3,
      rotateEveryNBuys: 2,
    },
  },
  {
    id: "balanced",
    label: "Standard",
    subtitle: "Balanced market making",
    icon: Shield,
    color: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    badge: "bg-purple-400/10 text-purple-400 border-purple-400/30",
    description:
      "60% buy bias with natural-looking sell pressure. Organic volume pattern. Steady 30s intervals with 5 active buyers. Good for sustained accumulation.",
    params: {
      sellProbability: 0.4,
      intervalSeconds: 30,
      activeBuyers: 5,
      activeSellers: 5,
      rotateEveryNBuys: 3,
    },
  },
  {
    id: "stealth",
    label: "Ghost Protocol",
    subtitle: "Low-profile accumulation",
    icon: Ghost,
    color: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    badge: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30",
    description:
      "Mimics organic trading closely. Equal buy/sell distribution, slow 45s intervals, randomized wallet rotation. Hardest to detect, slowest to target.",
    params: {
      sellProbability: 0.5,
      intervalSeconds: 45,
      activeBuyers: 4,
      activeSellers: 4,
      rotateEveryNBuys: 4,
    },
  },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: config } = useGetBotConfig();
  const { data: status } = useGetBotStatus({ query: { queryKey: getGetBotStatusQueryKey(), refetchInterval: 5000 } });
  const { data: logs } = useGetBotLogs({ query: { queryKey: getGetBotLogsQueryKey(), refetchInterval: 5000 } });
  const logsEndRef = useRef<HTMLDivElement>(null);

  const updateConfig = useUpdateBotConfig();
  const startBot = useStartBot();
  const stopBot = useStopBot();

  const [formData, setFormData] = React.useState<Record<string, unknown>>({});
  const initRef = useRef(false);

  useEffect(() => {
    if (config && !initRef.current) {
      setFormData({ ...config });
      initRef.current = true;
    }
  }, [config]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const selectStrategy = (strategy: (typeof STRATEGIES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      strategyMode: strategy.id,
      ...strategy.params,
    }));
  };

  const handleSave = () => {
    updateConfig.mutate(
      { data: formData as Parameters<typeof updateConfig.mutate>[0]["data"] },
      {
        onSuccess: () => {
          toast.success("Configuration inscribed.");
          queryClient.invalidateQueries({ queryKey: getGetBotConfigQueryKey() });
        },
        onError: () => toast.error("Failed to update config"),
      }
    );
  };

  const handleStart = () => {
    startBot.mutate(
      { data: formData as Parameters<typeof startBot.mutate>[0]["data"] },
      {
        onSuccess: () => {
          toast.success("Bot started. Spells are active.");
          queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "data" in err
              ? String((err as { data: unknown }).data)
              : "Failed to start bot";
          toast.error(msg);
        },
      }
    );
  };

  const handleStop = () => {
    stopBot.mutate(undefined, {
      onSuccess: () => {
        toast.success("Bot stopped.");
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      },
    });
  };

  const currentMode = (formData.strategyMode as StrategyMode) ?? "balanced";
  const activeStrategy = STRATEGIES.find((s) => s.id === currentMode) ?? STRATEGIES[1];

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
          Grimoire
        </h1>
        <div className="flex gap-3">
          {status?.running ? (
            <Button
              onClick={handleStop}
              disabled={stopBot.isPending}
              variant="destructive"
              className="uppercase font-bold tracking-widest gap-2 text-xs md:text-sm"
            >
              <Square fill="currentColor" size={14} /> Halt Ritual
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={startBot.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-bold tracking-widest gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)] text-xs md:text-sm"
            >
              <Play fill="currentColor" size={14} /> Begin Ritual
            </Button>
          )}
        </div>
      </div>

      {/* Strategy selector */}
      <Card className="bg-card/50 backdrop-blur border-border">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm uppercase tracking-widest text-primary">
            Strategy Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STRATEGIES.map((s) => {
              const isSelected = currentMode === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => selectStrategy(s)}
                  disabled={status?.running}
                  className={`relative text-left p-4 rounded border transition-all duration-200 ${
                    isSelected
                      ? `border-current/40 ${s.color} ${s.glow} bg-secondary/60`
                      : "border-border bg-secondary/20 text-muted-foreground hover:border-border/80 hover:bg-secondary/40"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2">
                      <Badge className={`text-[9px] uppercase tracking-widest font-bold border ${s.badge}`}>
                        Active
                      </Badge>
                    </span>
                  )}
                  <div className={`mb-2 ${isSelected ? s.color : ""}`}>
                    <Icon size={22} />
                  </div>
                  <div className={`text-sm font-bold mb-0.5 ${isSelected ? s.color : "text-foreground"}`}>
                    {s.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-3">{s.subtitle}</div>
                  <div className="text-[10px] text-muted-foreground/70 leading-relaxed">{s.description}</div>
                  <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-y-1 text-[10px] font-mono">
                    <span className="text-muted-foreground">Buy bias</span>
                    <span className={isSelected ? s.color : "text-foreground"}>
                      {Math.round((1 - s.params.sellProbability) * 100)}%
                    </span>
                    <span className="text-muted-foreground">Interval</span>
                    <span className={isSelected ? s.color : "text-foreground"}>
                      {s.params.intervalSeconds}s
                    </span>
                    <span className="text-muted-foreground">Active buyers</span>
                    <span className={isSelected ? s.color : "text-foreground"}>
                      {s.params.activeBuyers}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Config + logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Parameters */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-widest text-primary">
                Configuration Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Token Mint
                  </Label>
                  <Input
                    name="tokenMint"
                    value={(formData.tokenMint as string) ?? ""}
                    onChange={handleChange}
                    className="font-mono text-[11px] bg-background"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    RPC URL
                  </Label>
                  <Input
                    name="rpcUrl"
                    value={(formData.rpcUrl as string) ?? ""}
                    onChange={handleChange}
                    className="font-mono text-[11px] bg-background"
                    type="password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Target Market Cap ($)
                  </Label>
                  <Input
                    type="number"
                    name="targetMc"
                    value={(formData.targetMc as number) ?? 0}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Slippage (BPS)
                  </Label>
                  <Input
                    type="number"
                    name="slippageBps"
                    value={(formData.slippageBps as number) ?? 500}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Interval (seconds)
                  </Label>
                  <Input
                    type="number"
                    name="intervalSeconds"
                    value={(formData.intervalSeconds as number) ?? 30}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Sell Probability (0–1)
                  </Label>
                  <Input
                    type="number"
                    name="sellProbability"
                    value={(formData.sellProbability as number) ?? 0.4}
                    onChange={handleChange}
                    step="0.05"
                    min="0"
                    max="1"
                    className="font-mono bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Active Buyers
                  </Label>
                  <Input
                    type="number"
                    name="activeBuyers"
                    value={(formData.activeBuyers as number) ?? 5}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Active Sellers
                  </Label>
                  <Input
                    type="number"
                    name="activeSellers"
                    value={(formData.activeSellers as number) ?? 5}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Rotate After N Actions
                  </Label>
                  <Input
                    type="number"
                    name="rotateEveryNBuys"
                    value={(formData.rotateEveryNBuys as number) ?? 3}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total Wallets
                  </Label>
                  <Input
                    type="number"
                    name="totalWallets"
                    value={(formData.totalWallets as number) ?? 40}
                    onChange={handleChange}
                    className="font-mono bg-background"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updateConfig.isPending || status?.running}
                  className="bg-secondary text-foreground hover:bg-secondary/80 border border-border text-xs"
                >
                  {updateConfig.isPending ? "Scribing..." : "Inscribe Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <div>
          <Card className="bg-card/50 backdrop-blur border-border flex flex-col h-full min-h-[400px] lg:min-h-0">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-widest text-accent flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Arcane Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 bg-[#0a0a0f] font-mono text-[10px] max-h-[50vh] lg:max-h-none">
              <div className="p-3 space-y-1.5">
                {logs?.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-muted-foreground/40 shrink-0 text-[9px] pt-px">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`shrink-0 text-[9px] pt-px w-11 ${
                        log.level === "INFO"
                          ? "text-blue-400"
                          : log.level === "WARN"
                          ? "text-yellow-400"
                          : log.level === "ERROR"
                          ? "text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      [{log.level}]
                    </span>
                    <span className="text-foreground/70 break-words whitespace-pre-wrap leading-relaxed">
                      {log.message}
                    </span>
                  </div>
                ))}
                {(!logs || logs.length === 0) && (
                  <div className="text-muted-foreground/40 text-center py-8">
                    No incantations recorded yet.
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
