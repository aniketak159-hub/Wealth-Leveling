import { useState } from "react";
import { CheckCircle, AlertTriangle, TrendingUp, Wallet, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mirrors the ParseResult type from the backend
export interface ParsedAsset {
  label: string;
  amount: number;
  category: "STOCKS" | "MUTUAL_FUNDS" | "REAL_ESTATE" | "CASH" | "CRYPTO" | "OTHER";
}

export interface ParsedBudgetItem {
  label: string;
  planned: number;
  actual: number;
}

export interface ParseResult {
  bank: string;
  format: "csv" | "pdf" | "unknown";
  statementPeriod: string | null;
  confidence: "high" | "medium" | "low";
  transactionCount: number;
  budgetSuggestion: {
    monthlyIncome: number;
    items: ParsedBudgetItem[];
  };
  wealthSuggestion: {
    closingBalance?: number;
    assets: ParsedAsset[];
  };
  evaluationPrefill: {
    netWorth: number;
    monthlyIncome: number;
    totalSaved: number;
    totalSpent: number;
    budgetedExpenses: number;
    emergencyFundBalance: number;
  };
  warnings: string[];
}

interface Props {
  result: ParseResult;
  /** Called with final (possibly edited) budget items + assets */
  onApply: (data: {
    budget: { monthlyIncome: number; items: ParsedBudgetItem[] };
    wealth: { assets: ParsedAsset[] };
    evaluationPrefill: ParseResult["evaluationPrefill"];
  }) => void;
  onSkip: () => void;
  applyLabel?: string;
  isApplying?: boolean;
}

const CONFIDENCE_COLOR: Record<ParseResult["confidence"], string> = {
  high: "text-success border-success/40 bg-success/10",
  medium: "text-warning border-warning/40 bg-warning/10",
  low: "text-destructive border-destructive/40 bg-destructive/10",
};

const CATEGORY_COLORS: Record<string, string> = {
  "STOCKS": "text-blue-400",
  "MUTUAL_FUNDS": "text-purple-400",
  "REAL_ESTATE": "text-green-400",
  "CASH": "text-yellow-400",
  "CRYPTO": "text-orange-400",
  "OTHER": "text-slate-400",
};

export default function ParsePreview({ result, onApply, onSkip, applyLabel = "APPLY & CONTINUE", isApplying }: Props) {
  const [items, setItems] = useState<ParsedBudgetItem[]>(result.budgetSuggestion.items);
  const [assets, setAssets] = useState<ParsedAsset[]>(result.wealthSuggestion.assets);
  const [monthlyIncome, setMonthlyIncome] = useState(result.budgetSuggestion.monthlyIncome);
  const [showTxns, setShowTxns] = useState(false);

  const totalSpend = items.reduce((s, i) => s + i.actual, 0);

  function handleItemChange(idx: number, field: "actual" | "planned", val: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: parseFloat(val) || 0 } : item,
      ),
    );
  }

  function handleAssetAmountChange(idx: number, val: string) {
    setAssets((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, amount: parseFloat(val) || 0 } : a)),
    );
  }

  function handleApply() {
    const updatedPrefill: ParseResult["evaluationPrefill"] = {
      ...result.evaluationPrefill,
      monthlyIncome,
      totalSpent: totalSpend,
      totalSaved: Math.max(0, monthlyIncome - totalSpend),
      budgetedExpenses: items.reduce((s, i) => s + i.planned, 0),
      emergencyFundBalance:
        assets.find((a) => a.category === "CASH")?.amount ??
        result.evaluationPrefill.emergencyFundBalance,
      netWorth: assets.reduce((s, a) => s + a.amount, 0) || result.evaluationPrefill.netWorth,
    };
    onApply({ budget: { monthlyIncome, items }, wealth: { assets }, evaluationPrefill: updatedPrefill });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-primary tracking-widest text-sm">{result.bank}</p>
          {result.statementPeriod && (
            <p className="text-[10px] font-mono text-primary/50 mt-0.5">{result.statementPeriod}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-mono border px-2 py-0.5 ${CONFIDENCE_COLOR[result.confidence]}`}>
            {result.confidence.toUpperCase()} CONFIDENCE
          </span>
          <span className="text-[10px] font-mono text-primary/40 border border-primary/20 px-2 py-0.5">
            {result.transactionCount} TXN
          </span>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-1">
          {result.warnings.map((w, i) => (
            <div key={i} className="border border-warning/30 bg-warning/5 p-2.5 flex gap-2 items-start">
              <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-warning/80">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "INFLOW", value: monthlyIncome, color: "text-success" },
          { label: "OUTFLOW", value: totalSpend, color: "text-destructive" },
          { label: "SAVED", value: Math.max(0, monthlyIncome - totalSpend), color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="border border-primary/20 bg-primary/5 p-3 text-center">
            <p className="text-[9px] font-mono text-primary/40 mb-1">{label}</p>
            <p className={`text-sm font-mono font-bold ${color}`}>
              ₹{value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly income edit */}
      <div className="flex items-center gap-3 border border-primary/20 p-3">
        <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-mono text-primary/50">DETECTED MONTHLY INCOME</p>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
            className="bg-transparent font-mono text-success text-sm w-full outline-none border-b border-primary/20 focus:border-primary pb-0.5 mt-0.5"
          />
        </div>
      </div>

      {/* Budget categories */}
      {items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-[10px] font-mono text-primary/60 tracking-widest">BUDGET CATEGORIES — EDIT TO ADJUST</p>
          </div>
          <div className="border border-primary/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[9px]">CATEGORY</TableHead>
                  <TableHead className="text-[9px] text-right">ACTUAL SPEND</TableHead>
                  <TableHead className="text-[9px] text-right">BUDGET</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs py-2">{item.label}</TableCell>
                    <TableCell className="py-2">
                      <input
                        type="number"
                        value={item.actual}
                        onChange={(e) => handleItemChange(idx, "actual", e.target.value)}
                        className="bg-transparent font-mono text-xs text-right w-full outline-none text-destructive border-b border-transparent focus:border-primary/40 pb-0.5"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <input
                        type="number"
                        value={item.planned}
                        onChange={(e) => handleItemChange(idx, "planned", e.target.value)}
                        className="bg-transparent font-mono text-xs text-right w-full outline-none text-primary/70 border-b border-transparent focus:border-primary/40 pb-0.5"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detected assets */}
      {assets.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-[10px] font-mono text-primary/60 tracking-widest">DETECTED ASSETS</p>
          </div>
          <div className="space-y-1">
            {assets.map((asset, idx) => (
              <div key={idx} className="border border-primary/20 bg-primary/5 p-2.5 flex items-center gap-3">
                <span className={`text-[9px] font-mono flex-shrink-0 ${CATEGORY_COLORS[asset.category] ?? "text-slate-400"}`}>
                  {asset.category.replace("_", " ")}
                </span>
                <span className="font-mono text-xs text-primary/70 flex-1 truncate">{asset.label}</span>
                <input
                  type="number"
                  value={asset.amount}
                  onChange={(e) => handleAssetAmountChange(idx, e.target.value)}
                  className="bg-transparent font-mono text-xs text-right w-32 outline-none text-primary border-b border-transparent focus:border-primary/40 pb-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {items.length === 0 && assets.length === 0 && (
        <div className="border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-xs font-mono text-destructive/80">
            COULD NOT EXTRACT TRANSACTION DATA. TRY EXPORTING AS CSV FROM YOUR BANK&apos;S NETBANKING PORTAL.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <Button className="w-full" onClick={handleApply} disabled={isApplying}>
          {isApplying ? "APPLYING..." : applyLabel}
        </Button>
        <button
          onClick={onSkip}
          className="text-[10px] font-mono text-primary/40 hover:text-primary/70 transition-colors text-center py-1"
        >
          SKIP AUTO-IMPORT — ENTER MANUALLY INSTEAD
        </button>
      </div>
    </div>
  );
}
