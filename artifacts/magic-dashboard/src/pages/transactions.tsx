import React from "react";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey(), refetchInterval: 10000 },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
          Spell Log
        </h1>
        <span className="text-xs text-muted-foreground font-mono">
          {transactions?.length ?? 0} records
        </span>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-2">
        {isLoading && (
          <div className="text-center text-muted-foreground text-sm py-8 animate-pulse">
            Reading the ledger...
          </div>
        )}
        {transactions?.map((tx) => (
          <Card key={tx.id} className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold ${
                    tx.action === "BUY"
                      ? "text-green-400 border-green-400/30"
                      : "text-red-400 border-red-400/30"
                  }`}
                >
                  {tx.action}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  W-{tx.walletId}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-bold text-foreground font-mono">◎{tx.amount.toFixed(4)}</span>
                <span className="text-accent font-mono text-xs">
                  ${(tx.marketCap / 1000).toFixed(2)}k MC
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-mono">
                  {format(new Date(tx.timestamp), "MMM dd, HH:mm:ss")}
                </span>
                <a
                  href={`https://solscan.io/tx/${tx.txSignature}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono"
                >
                  {tx.txSignature.substring(0, 10)}...
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (!transactions || transactions.length === 0) && (
          <div className="text-center text-muted-foreground text-sm py-12">
            No transactions yet.
          </div>
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden md:block bg-card/50 backdrop-blur border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono text-left">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/80 border-b border-border">
                <tr>
                  <th className="px-5 py-4 font-normal">Time</th>
                  <th className="px-5 py-4 font-normal">Action</th>
                  <th className="px-5 py-4 font-normal">Wallet</th>
                  <th className="px-5 py-4 font-normal text-right">Amount (SOL)</th>
                  <th className="px-5 py-4 font-normal text-right">Market Cap</th>
                  <th className="px-5 py-4 font-normal text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground animate-pulse">
                      Reading the ledger...
                    </td>
                  </tr>
                )}
                {transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {format(new Date(tx.timestamp), "MMM dd, HH:mm:ss")}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase ${
                          tx.action === "BUY"
                            ? "text-green-400 border-green-400/30"
                            : "text-red-400 border-red-400/30"
                        }`}
                      >
                        {tx.action}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-foreground">W-{tx.walletId}</td>
                    <td className="px-5 py-3 text-right font-bold text-foreground">
                      ◎{tx.amount.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-right text-accent">
                      ${(tx.marketCap / 1000).toFixed(2)}k
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`https://solscan.io/tx/${tx.txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-white transition-colors group-hover:underline"
                      >
                        {tx.txSignature.substring(0, 14)}...
                      </a>
                    </td>
                  </tr>
                ))}
                {!isLoading && (!transactions || transactions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
