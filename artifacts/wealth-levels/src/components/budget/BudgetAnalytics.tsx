import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MonthData {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  reserves: number;
  txCount: number;
}

interface AnalyticsData {
  year: number;
  months: MonthData[];
  totals: { income: number; expense: number; reserves: number };
  projection: { annualIncome: number; annualExpense: number; annualReserves: number };
}

function fmtINR(n: number) {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const MONTH_LABELS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export default function BudgetAnalytics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/budget/analytics?year=${year}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [year]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Max value for bar scaling
  const maxVal = data
    ? Math.max(...data.months.map(m => Math.max(m.income, m.expense)), 1)
    : 1;

  const hasSomeData = data && data.months.some(m => m.txCount > 0);
  const monthsWithData = data ? data.months.filter(m => m.txCount > 0).length : 0;

  return (
    <div className="space-y-4">
      {/* ── Year navigator ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Annual Budget Analytics
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1.5 border border-primary/20 hover:border-primary/50 text-primary/50 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-sm tracking-widest text-primary px-3">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="p-1.5 border border-primary/20 hover:border-primary/50 text-primary/50 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-8 text-center text-primary/40 font-mono text-xs hud-cursor">LOADING ANNUAL DATA...</div>
      )}

      {!loading && data && (
        <>
          {/* ── Yearly summary cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-primary/5">
              <CardContent className="p-3">
                <div className="text-[9px] font-mono text-muted-foreground tracking-widest mb-1">YTD INCOME</div>
                <div className="text-base font-mono text-green-400 font-bold">{fmtINR(data.totals.income)}</div>
                <div className="text-[9px] font-mono text-muted-foreground/50">{monthsWithData} months recorded</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5">
              <CardContent className="p-3">
                <div className="text-[9px] font-mono text-muted-foreground tracking-widest mb-1">YTD EXPENSE</div>
                <div className="text-base font-mono text-red-400 font-bold">{fmtINR(data.totals.expense)}</div>
                <div className="text-[9px] font-mono text-muted-foreground/50">{monthsWithData} months recorded</div>
              </CardContent>
            </Card>
            <Card className={`${data.totals.reserves >= 0 ? "bg-primary/5" : "bg-red-500/5 border-red-500/20"}`}>
              <CardContent className="p-3">
                <div className="text-[9px] font-mono text-muted-foreground tracking-widest mb-1">NET SAVINGS</div>
                <div className={`text-base font-mono font-bold ${data.totals.reserves >= 0 ? "text-primary" : "text-red-400"}`}>
                  {data.totals.reserves >= 0 ? "" : "−"}{fmtINR(data.totals.reserves)}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/50">
                  {data.totals.income > 0
                    ? `${((data.totals.reserves / data.totals.income) * 100).toFixed(1)}% savings rate`
                    : "no data"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-3">
                <div className="text-[9px] font-mono text-muted-foreground tracking-widest mb-1 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-primary" /> PROJECTED ANNUAL
                </div>
                <div className={`text-base font-mono font-bold ${data.projection.annualReserves >= 0 ? "text-primary" : "text-red-400"}`}>
                  {data.projection.annualReserves >= 0 ? "" : "−"}{fmtINR(data.projection.annualReserves)}
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/50">
                  {monthsWithData > 0 ? `Based on ${monthsWithData}/12 months` : "insufficient data"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Projection detail ─────────────────────────────────────────── */}
          {monthsWithData > 0 && (
            <div className="border border-primary/20 bg-primary/3 px-4 py-3 space-y-2">
              <div className="text-[9px] font-mono text-muted-foreground tracking-widest">
                PROJECTED FULL-YEAR ESTIMATE ({year}) — based on {monthsWithData} months of data
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">EST. ANNUAL INCOME</div>
                  <div className="text-sm font-mono text-green-400">{fmtINR(data.projection.annualIncome)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">EST. ANNUAL EXPENSE</div>
                  <div className="text-sm font-mono text-red-400">{fmtINR(data.projection.annualExpense)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">EST. ANNUAL SAVINGS</div>
                  <div className={`text-sm font-mono font-bold ${data.projection.annualReserves >= 0 ? "text-primary" : "text-red-400"}`}>
                    {fmtINR(data.projection.annualReserves)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Month-by-month chart ──────────────────────────────────────── */}
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_72px_72px_72px] gap-2 px-1 mb-2">
              <div className="text-[9px] font-mono text-muted-foreground/50 tracking-widest">MO</div>
              <div className="text-[9px] font-mono text-muted-foreground/50 tracking-widest">CASH FLOW</div>
              <div className="text-[9px] font-mono text-muted-foreground/50 tracking-widest text-right">INCOME</div>
              <div className="text-[9px] font-mono text-muted-foreground/50 tracking-widest text-right">EXPENSE</div>
              <div className="text-[9px] font-mono text-muted-foreground/50 tracking-widest text-right">RESERVES</div>
            </div>

            {data.months.map((m, idx) => {
              const label = MONTH_LABELS[idx];
              const isCurrent = m.month === currentMonth;
              const isEmpty = m.txCount === 0;
              const isFuture = m.month > currentMonth;
              const incomeW = m.income > 0 ? (m.income / maxVal) * 100 : 0;
              const expenseW = m.expense > 0 ? (m.expense / maxVal) * 100 : 0;

              return (
                <div
                  key={m.month}
                  className={`grid grid-cols-[40px_1fr_72px_72px_72px] gap-2 px-1 py-1.5 items-center border-b border-primary/5
                    ${isCurrent ? "bg-primary/5 border-primary/20" : ""}
                    ${isFuture ? "opacity-30" : ""}`}
                >
                  {/* Month label */}
                  <div className={`text-[10px] font-mono ${isCurrent ? "text-primary font-bold" : "text-muted-foreground/60"}`}>
                    {label}
                    {isCurrent && <div className="text-[7px] text-primary/60">NOW</div>}
                  </div>

                  {/* Bar chart */}
                  <div className="space-y-1">
                    {isEmpty && !isFuture ? (
                      <div className="text-[9px] font-mono text-muted-foreground/30">— no data —</div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <div className="h-2 bg-green-400/80 rounded-sm transition-all duration-500" style={{ width: `${incomeW}%`, minWidth: incomeW > 0 ? "2px" : "0" }} />
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-2 bg-red-400/80 rounded-sm transition-all duration-500" style={{ width: `${expenseW}%`, minWidth: expenseW > 0 ? "2px" : "0" }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Numbers */}
                  <div className="text-right font-mono text-[10px] text-green-400">
                    {m.income > 0 ? fmtINR(m.income) : "—"}
                  </div>
                  <div className="text-right font-mono text-[10px] text-red-400">
                    {m.expense > 0 ? fmtINR(m.expense) : "—"}
                  </div>
                  <div className={`text-right font-mono text-[10px] font-bold
                    ${m.txCount === 0 ? "text-muted-foreground/30" : m.reserves >= 0 ? "text-primary/80" : "text-red-400"}`}>
                    {m.txCount === 0 ? "—" : (m.reserves >= 0 ? "+" : "−") + fmtINR(m.reserves)}
                  </div>
                </div>
              );
            })}

            {/* Year total row */}
            {hasSomeData && (
              <div className="grid grid-cols-[40px_1fr_72px_72px_72px] gap-2 px-1 py-2 items-center border-t border-primary/30 mt-1">
                <div className="text-[9px] font-mono text-primary/60 tracking-widest">TOT</div>
                <div />
                <div className="text-right font-mono text-xs text-green-400 font-bold">{fmtINR(data.totals.income)}</div>
                <div className="text-right font-mono text-xs text-red-400 font-bold">{fmtINR(data.totals.expense)}</div>
                <div className={`text-right font-mono text-xs font-bold ${data.totals.reserves >= 0 ? "text-primary" : "text-red-400"}`}>
                  {data.totals.reserves >= 0 ? "+" : "−"}{fmtINR(data.totals.reserves)}
                </div>
              </div>
            )}
          </div>

          {!hasSomeData && (
            <div className="py-6 text-center text-muted-foreground font-mono text-xs border border-dashed border-primary/20">
              NO TRANSACTIONS RECORDED FOR {year}.<br />
              <span className="text-primary/40 text-[10px]">Log transactions to see your annual picture.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
