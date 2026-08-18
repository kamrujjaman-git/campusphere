export function FinanceSummaryCards({
  totalFund,
  totalCollected,
  totalDue,
  totalExpense,
}: {
  totalFund: number;
  totalCollected: number;
  totalDue: number;
  totalExpense: number;
}) {
  const cards = [
    { label: "Current Fund", value: totalFund, accent: true },
    { label: "Total Collected", value: totalCollected },
    { label: "Total Due", value: totalDue, warning: true },
    { label: "Total Expense", value: totalExpense },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <div
          key={c.label}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
          <p
            className={`text-2xl font-bold ${
              c.accent
                ? "text-primary"
                : c.warning
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            ৳{c.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
