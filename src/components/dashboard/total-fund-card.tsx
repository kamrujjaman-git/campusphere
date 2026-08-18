import { Wallet } from "lucide-react";

export function TotalFundCard({ amount }: { amount: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/30 p-6 sm:p-8">
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
        <Wallet size={16} className="text-primary" />
        Community Total Fund
      </div>
      <p className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
        ৳{amount.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Visible to every member — use this when discussing events & tours.
      </p>
    </div>
  );
}
