import { useState, useEffect, useCallback } from "react";
import { useGetBudget, useUpdateBudget } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Calendar, List, Upload, Wallet,
} from "lucide-react";
import ImportStatementModal from "@/components/import/ImportStatementModal";
import BankConnectPanel from "@/components/import/BankConnectPanel";
import TransactionModal, { type TxRow } from "@/components/budget/TransactionModal";
import CategoryModal, { type CategoryRow } from "@/components/budget/CategoryModal";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TxRecord extends TxRow { id: number; createdAt: string; }

type SubTab = "ledger" | "allocation" | "calendar";

function fmtINR(n: number) {
  return "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function currentYM() { return new Date().toISOString().slice(0, 7); }

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function calendarDays(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m, 0).getDate();
  return { firstDow, daysInMonth };
}

export default function BudgetTab() {
  const [subTab, setSubTab] = useState<SubTab>("ledger");
  const [month, setMonth] = useState(currentYM());
  const [importOpen, setImportOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<TxRow | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategoryRow | null>(null);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [incomeEdit, setIncomeEdit] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  const { data: budget, isLoading, refetch } = useGetBudget();
  const { mutateAsync: updateBudget } = useUpdateBudget();

  // Load transactions for current month
  const loadTx = useCallback(async (ym: string) => {
    setTxLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/budget/transactions?month=${ym}`, { credentials: "include" });
      if (r.ok) setTransactions(await r.json());
    } finally { setTxLoading(false); }
  }, []);

  useEffect(() => { loadTx(month); }, [month, loadTx]);

  if (isLoading) return <div className="p-8 text-center text-primary font-mono hud-cursor">CALCULATING CASH FLOW...</div>;
  if (!budget) return <div className="p-8 text-center text-destructive font-mono">BUDGET MODULE OFFLINE</div>;

  // Derived stats from transactions
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const reserves = totalIncome - totalExpense;

  // Allocation actuals: sum expenses by category label for this month
  const actualByCategory: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    actualByCategory[t.category] = (actualByCategory[t.category] ?? 0) + t.amount;
  });

  const burnRate = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // All expense categories for the dropdown
  const knownCategories = [
    ...new Set([
      ...budget.items.map(i => i.label),
      ...transactions.filter(t => t.type === "expense").map(t => t.category),
    ]),
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────
  function onTxSaved(tx: TxRecord) {
    setTransactions(prev => {
      const idx = prev.findIndex(t => t.id === tx.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = tx; return n.sort((a, b) => b.date.localeCompare(a.date)); }
      return [tx, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  async function deleteTx(id: number) {
    if (!confirm("Delete this transaction?")) return;
    await fetch(`${BASE_URL}/api/budget/transactions/${id}`, { method: "DELETE", credentials: "include" });
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  async function saveIncome() {
    const v = parseFloat(incomeInput);
    if (isNaN(v) || v < 0) return;
    await updateBudget({ data: { monthlyIncome: v } });
    await refetch();
    setIncomeEdit(false);
  }

  async function saveCat(row: CategoryRow) {
    const items = budget.items.map(i => ({
      label: i.label,
      planned: i.planned,
      actual: i.actual,
    }));
    if (row.id) {
      const idx = budget.items.findIndex(i => i.id === row.id);
      if (idx >= 0) items[idx] = { label: row.label, planned: row.planned, actual: budget.items[idx].actual };
    } else {
      items.push({ label: row.label, planned: row.planned, actual: 0 });
    }
    await updateBudget({ data: { items } });
    await refetch();
  }

  async function deleteCat(id: number) {
    if (!confirm("Remove this category?")) return;
    const items = budget.items
      .filter(i => i.id !== id)
      .map(i => ({ label: i.label, planned: i.planned, actual: i.actual }));
    await updateBudget({ data: { items } });
    await refetch();
  }

  // ── Calendar data ─────────────────────────────────────────────────────────
  const { firstDow, daysInMonth } = calendarDays(month);
  const dayTotals: Record<number, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const d = parseInt(t.date.slice(8, 10), 10);
    if (!dayTotals[d]) dayTotals[d] = { income: 0, expense: 0 };
    if (t.type === "income") dayTotals[d].income += t.amount;
    else dayTotals[d].expense += t.amount;
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Top Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="text-[10px] text-muted-foreground font-mono mb-1 tracking-widest">TOTAL INFLOW</div>
            <div className="text-xl font-mono text-green-400 font-bold">{fmtINR(totalIncome)}</div>
            <div className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{monthLabel(month)}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="text-[10px] text-muted-foreground font-mono mb-1 tracking-widest">TOTAL OUTFLOW</div>
            <div className="text-xl font-mono text-red-400 font-bold">{fmtINR(totalExpense)}</div>
            <div className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{monthLabel(month)}</div>
          </CardContent>
        </Card>
        <Card className={`${reserves >= 0 ? "bg-primary/5" : "bg-red-500/5 border-red-500/30"}`}>
          <CardContent className="p-4">
            <div className="text-[10px] text-muted-foreground font-mono mb-1 tracking-widest">RESERVES</div>
            <div className={`text-xl font-mono font-bold ${reserves >= 0 ? "text-primary" : "text-red-400"}`}>
              {reserves >= 0 ? "" : "−"}{fmtINR(reserves)}
            </div>
            <div className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">Inflow − Outflow</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Month navigator + sub-tabs ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Sub-tab pills */}
        <div className="flex gap-1">
          {([
            { key: "ledger",     icon: List,     label: "LEDGER"     },
            { key: "allocation", icon: BarChart,  label: "ALLOCATION" },
            { key: "calendar",   icon: Calendar,  label: "CALENDAR"   },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[10px] tracking-widest transition-colors
                ${subTab === key
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-primary/20 bg-transparent text-primary/40 hover:border-primary/40 hover:text-primary/70"}`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        {/* Month stepper */}
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="p-1.5 border border-primary/20 hover:border-primary/50 text-primary/50 hover:text-primary transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] tracking-widest text-primary/70 px-2 min-w-[130px] text-center">
            {monthLabel(month)}
          </span>
          <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="p-1.5 border border-primary/20 hover:border-primary/50 text-primary/50 hover:text-primary transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ══ LEDGER TAB ══════════════════════════════════════════════════════ */}
      {subTab === "ledger" && (
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/20">
            <CardTitle className="text-sm flex items-center gap-2">
              <List className="w-4 h-4" /> TRANSACTION LEDGER
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> IMPORT
              </Button>
              <Button size="sm" onClick={() => { setEditTx(null); setTxOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> ADD
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="p-8 text-center text-primary/40 font-mono text-xs hud-cursor">LOADING...</div>
            ) : transactions.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground font-mono text-xs border-dashed border border-primary/10 m-4">
                NO TRANSACTIONS FOR {monthLabel(month).toUpperCase()}.<br />
                <span className="text-primary/40 text-[10px]">Hit ADD to log your first entry.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">DATE</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead className="hidden sm:table-cell">NOTE</TableHead>
                      <TableHead className="text-right">AMOUNT</TableHead>
                      <TableHead className="w-[60px]">TYPE</TableHead>
                      <TableHead className="w-[70px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-[10px] text-muted-foreground">{tx.date.slice(5)}</TableCell>
                        <TableCell className="font-mono text-xs text-primary">{tx.category}</TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-[10px] text-muted-foreground max-w-[160px] truncate">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold
                          ${tx.type === "income" ? "text-green-400" : "text-red-400"}`}>
                          {tx.type === "income" ? "+" : "−"}{fmtINR(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 border
                            ${tx.type === "income"
                              ? "border-green-400/30 bg-green-400/5 text-green-400"
                              : "border-red-400/30 bg-red-400/5 text-red-400"}`}>
                            {tx.type === "income"
                              ? <TrendingUp className="w-2.5 h-2.5" />
                              : <TrendingDown className="w-2.5 h-2.5" />}
                            {tx.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditTx(tx); setTxOpen(true); }}
                              className="p-1 text-primary/40 hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteTx(tx.id)}
                              className="p-1 text-primary/40 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ ALLOCATION TAB ══════════════════════════════════════════════════ */}
      {subTab === "allocation" && (
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/20">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart className="w-4 h-4" /> ALLOCATION MATRIX
            </CardTitle>
            <Button size="sm" onClick={() => { setEditCat(null); setCatOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> CATEGORY
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Planned income row */}
            <div className="flex items-center justify-between px-3 py-2 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-primary/50" />
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest">PLANNED MONTHLY INCOME</span>
              </div>
              {incomeEdit ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={incomeInput}
                    onChange={e => setIncomeInput(e.target.value)}
                    className="w-28 bg-primary/5 border border-primary/30 text-primary font-mono text-xs px-2 py-1 focus:outline-none"
                    onKeyDown={e => e.key === "Enter" && saveIncome()}
                    autoFocus
                  />
                  <Button size="sm" className="h-6 text-[10px] px-2" onClick={saveIncome}>SAVE</Button>
                  <button onClick={() => setIncomeEdit(false)} className="text-primary/40 hover:text-primary text-[10px] font-mono">CANCEL</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-green-400 font-bold">{fmtINR(budget.monthlyIncome)}</span>
                  <button
                    onClick={() => { setIncomeInput(String(budget.monthlyIncome)); setIncomeEdit(true); }}
                    className="p-1 text-primary/40 hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Burn rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">BURN RATE ({monthLabel(month)})</span>
                <span className={burnRate > 90 ? "text-red-400" : "text-primary/70"}>{burnRate.toFixed(1)}% OF INFLOW</span>
              </div>
              <Progress value={Math.min(100, burnRate)} indicatorColor={burnRate > 90 ? "bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]" : undefined} />
            </div>

            {/* Categories table */}
            {budget.items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground font-mono text-xs border border-dashed border-primary/20">
                NO CATEGORIES — HIT "+ CATEGORY" TO ADD ONE.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead className="text-right">PLANNED</TableHead>
                    <TableHead className="text-right">ACTUAL</TableHead>
                    <TableHead className="w-[30%]">STATUS</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.items.map(item => {
                    const actual = actualByCategory[item.label] ?? 0;
                    const percent = item.planned > 0 ? (actual / item.planned) * 100 : 0;
                    const isOver = actual > item.planned && item.planned > 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-primary">{item.label}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmtINR(item.planned)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${isOver ? "text-red-400" : "text-primary/80"}`}>
                          {fmtINR(actual)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(100, percent)}
                              className="h-1.5"
                              indicatorColor={isOver ? "bg-red-500 shadow-[0_0_8px_rgba(255,0,0,0.7)]" : undefined}
                            />
                            <span className={`text-[10px] font-mono w-9 text-right ${isOver ? "text-red-400" : "text-primary/60"}`}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setEditCat({ id: item.id, label: item.label, planned: item.planned }); setCatOpen(true); }}
                              className="p-1 text-primary/40 hover:text-primary transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteCat(item.id)}
                              className="p-1 text-primary/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ CALENDAR TAB ════════════════════════════════════════════════════ */}
      {subTab === "calendar" && (
        <Card className="flex-1">
          <CardHeader className="pb-2 border-b border-primary/20">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {monthLabel(month).toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                <div key={d} className="text-center text-[9px] font-mono text-muted-foreground/50 tracking-widest py-1">{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px bg-primary/10">
              {/* Leading empty cells */}
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`e${i}`} className="bg-background min-h-[56px]" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const totals = dayTotals[day];
                const todayStr = new Date().toISOString().slice(0, 10);
                const cellStr = `${month}-${String(day).padStart(2, "0")}`;
                const isToday = cellStr === todayStr;
                return (
                  <div
                    key={day}
                    className={`bg-background min-h-[56px] p-1.5 border-b border-r border-transparent flex flex-col
                      ${isToday ? "ring-1 ring-inset ring-primary/40" : ""}
                      ${totals ? "cursor-pointer hover:bg-primary/5" : ""}`}
                    onClick={() => totals && setSubTab("ledger")}
                    title={totals ? `Income: ${fmtINR(totals.income)}  Expense: ${fmtINR(totals.expense)}` : undefined}
                  >
                    <span className={`text-[10px] font-mono ${isToday ? "text-primary font-bold" : "text-muted-foreground/50"}`}>
                      {day}
                    </span>
                    {totals && (
                      <div className="mt-auto space-y-0.5">
                        {totals.income > 0 && (
                          <div className="text-[8px] font-mono text-green-400 truncate">+{fmtINR(totals.income)}</div>
                        )}
                        {totals.expense > 0 && (
                          <div className="text-[8px] font-mono text-red-400 truncate">−{fmtINR(totals.expense)}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-3 justify-end">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-green-400/70">
                <div className="w-2 h-2 bg-green-400/40 rounded-sm" /> INCOME
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-red-400/70">
                <div className="w-2 h-2 bg-red-400/40 rounded-sm" /> EXPENSE
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Bank connect ───────────────────────────────────────────────────── */}
      <BankConnectPanel />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ImportStatementModal open={importOpen} onClose={() => setImportOpen(false)} />

      <TransactionModal
        open={txOpen}
        initial={editTx}
        categories={knownCategories}
        onClose={() => { setTxOpen(false); setEditTx(null); }}
        onSave={tx => onTxSaved(tx as TxRecord)}
      />

      <CategoryModal
        open={catOpen}
        initial={editCat}
        onClose={() => { setCatOpen(false); setEditCat(null); }}
        onSave={saveCat}
      />
    </div>
  );
}
