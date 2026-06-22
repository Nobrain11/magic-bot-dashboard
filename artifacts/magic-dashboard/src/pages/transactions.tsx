import React from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions({ query: { refetchInterval: 10000 } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-2 inline-block">
          Spell Log (Transactions)
        </h1>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono text-left">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/80 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-normal">Time</th>
                  <th className="px-6 py-4 font-normal">Action</th>
                  <th className="px-6 py-4 font-normal">Wallet</th>
                  <th className="px-6 py-4 font-normal text-right">Amount (SOL)</th>
                  <th className="px-6 py-4 font-normal text-right">Market Cap</th>
                  <th className="px-6 py-4 font-normal text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                      Reading the ledger...
                    </td>
                  </tr>
                )}
                {transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(tx.timestamp), "MMM dd, HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`text-[10px] uppercase ${tx.action === 'BUY' ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'}`}>
                        {tx.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      W-{tx.walletId}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      ◎{tx.amount.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-right text-accent">
                      ${(tx.marketCap / 1000).toFixed(2)}k
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`https://solscan.io/tx/${tx.txSignature}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary hover:text-white transition-colors group-hover:underline"
                      >
                        {tx.txSignature.substring(0, 16)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
