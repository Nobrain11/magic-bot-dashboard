import React, { useEffect, useRef } from "react";
import { useGetBotConfig, useUpdateBotConfig, useGetBotStatus, useStartBot, useStopBot, useGetBotLogs, getGetBotStatusQueryKey, getGetBotConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Play, Square } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: config } = useGetBotConfig();
  const { data: status } = useGetBotStatus({ query: { refetchInterval: 5000 } });
  const { data: logs } = useGetBotLogs({ query: { refetchInterval: 5000 } });
  
  const updateConfig = useUpdateBotConfig();
  const startBot = useStartBot();
  const stopBot = useStopBot();

  const [formData, setFormData] = React.useState<any>({});
  const initRef = useRef(false);

  useEffect(() => {
    if (config && !initRef.current) {
      setFormData(config);
      initRef.current = true;
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    updateConfig.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Arcane configurations updated.");
        queryClient.invalidateQueries({ queryKey: getGetBotConfigQueryKey() });
      },
      onError: (err) => {
        toast.error("Failed to update config");
      }
    });
  };

  const handleStart = () => {
    startBot.mutate({ data: formData }, {
      onSuccess: () => {
        toast.success("Bot started. Spells are active.");
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      }
    });
  };

  const handleStop = () => {
    stopBot.mutate(undefined, {
      onSuccess: () => {
        toast.success("Bot stopped. Mana flow halted.");
        queryClient.invalidateQueries({ queryKey: getGetBotStatusQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
          Grimoire (Settings & Logs)
        </h1>
        
        <div className="flex gap-4">
          {status?.running ? (
            <Button 
              onClick={handleStop} 
              disabled={stopBot.isPending}
              variant="destructive"
              className="uppercase font-bold tracking-widest gap-2"
            >
              <Square fill="currentColor" size={16} /> Halt Ritual
            </Button>
          ) : (
            <Button 
              onClick={handleStart} 
              disabled={startBot.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase font-bold tracking-widest gap-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            >
              <Play fill="currentColor" size={16} /> Begin Ritual
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur border-border h-full">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-widest text-primary">Configuration Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Token Mint</Label>
                  <Input name="tokenMint" value={formData.tokenMint || ''} onChange={handleChange} className="font-mono text-xs bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">RPC URL</Label>
                  <Input name="rpcUrl" value={formData.rpcUrl || ''} onChange={handleChange} className="font-mono text-xs bg-background" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target Market Cap ($)</Label>
                  <Input type="number" name="targetMc" value={formData.targetMc || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Initial Market Cap ($)</Label>
                  <Input type="number" name="initialMc" value={formData.initialMc || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Active Buyers</Label>
                  <Input type="number" name="activeBuyers" value={formData.activeBuyers || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Active Sellers</Label>
                  <Input type="number" name="activeSellers" value={formData.activeSellers || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Interval (seconds)</Label>
                  <Input type="number" name="intervalSeconds" value={formData.intervalSeconds || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sell Probability (%)</Label>
                  <Input type="number" name="sellProbability" value={formData.sellProbability || 0} onChange={handleChange} className="font-mono bg-background" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button onClick={handleSave} disabled={updateConfig.isPending || status?.running} className="bg-secondary text-foreground hover:bg-secondary/80 border border-border">
                  {updateConfig.isPending ? "Scribing..." : "Inscribe Configuration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 h-full">
          <Card className="bg-card/50 backdrop-blur border-border h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-widest text-accent flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Arcane Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 bg-[#0a0a0f] font-mono text-[10px]">
              <div className="p-4 space-y-2">
                {logs?.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-muted-foreground/50 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`shrink-0 w-12 ${
                      log.level === 'INFO' ? 'text-blue-400' :
                      log.level === 'WARN' ? 'text-yellow-400' :
                      log.level === 'ERROR' ? 'text-red-400' : 'text-muted-foreground'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-foreground/80 break-words whitespace-pre-wrap">{log.message}</span>
                  </div>
                ))}
                {(!logs || logs.length === 0) && (
                  <div className="text-muted-foreground/50 text-center py-8">No incantations recorded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
