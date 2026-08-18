export function MyStatusCard({
  myDue,
  myPaid,
}: {
  myDue: number;
  myPaid: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-xl bg-card border border-border">
        <p className="text-xs text-muted-foreground mb-1">You&apos;ve Paid</p>
        <p className="text-xl font-bold text-primary">৳{myPaid}</p>
      </div>
      <div className="p-4 rounded-xl bg-card border border-border">
        <p className="text-xs text-muted-foreground mb-1">You Owe</p>
        <p className="text-xl font-bold text-destructive">৳{myDue}</p>
      </div>
    </div>
  );
}
