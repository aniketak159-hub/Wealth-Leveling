import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRunEvaluation, useGetDashboard } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ClipboardList, X, ArrowLeft, CheckCircle, Zap, TrendingUp, ChevronRight } from "lucide-react";

type Screen = "method" | "upload" | "manual" | "result";

interface ResultData {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newXp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormFields {
  netWorth: string;
  monthlyIncome: string;
  totalSaved: string;
  totalSpent: string;
  budgetedExpenses: string;
  emergencyFundBalance: string;
  investmentGrowthPct: string;
  portfolioCategories: string[];
}

const CATEGORIES = ["STOCKS", "MUTUAL FUNDS", "REAL ESTATE", "CASH", "CRYPTO", "OTHER"];

export default function EvaluationModal({ open, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("method");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fields, setFields] = useState<FormFields>({
    netWorth: "",
    monthlyIncome: "",
    totalSaved: "",
    totalSpent: "",
    budgetedExpenses: "",
    emergencyFundBalance: "",
    investmentGrowthPct: "",
    portfolioCategories: [],
  });

  const queryClient = useQueryClient();
  const { mutate: runEvaluation, isPending } = useRunEvaluation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setResult({
          xpGained: data.xpGained,
          leveledUp: data.leveledUp,
          newLevel: data.newLevel,
          newXp: data.newXp,
        });
        setScreen("result");
      },
      onError: () => {
        setError("EVALUATION FAILED. CHECK INPUTS AND RETRY.");
      },
    },
  });

  const setField = (key: keyof FormFields, value: string | string[]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const toggleCategory = (cat: string) => {
    setFields((f) => ({
      ...f,
      portfolioCategories: f.portfolioCategories.includes(cat)
        ? f.portfolioCategories.filter((c) => c !== cat)
        : [...f.portfolioCategories, cat],
    }));
  };

  function computeAndSubmit() {
    setError(null);
    const income = parseFloat(fields.monthlyIncome) || 0;
    const saved = parseFloat(fields.totalSaved) || 0;
    const spent = parseFloat(fields.totalSpent) || 0;
    const budgeted = parseFloat(fields.budgetedExpenses) || 0;
    const emergency = parseFloat(fields.emergencyFundBalance) || 0;
    const netWorth = parseFloat(fields.netWorth);

    if (isNaN(netWorth) || netWorth < 0) {
      setError("NET WORTH IS REQUIRED.");
      return;
    }

    // Savings rate: saved / income × 100, capped 0-100
    const savingsRate =
      income > 0 ? Math.max(0, Math.min(100, (saved / income) * 100)) : 0;

    // Budget adherence: how much under budget, capped 0-100
    const budgetAdherence =
      budgeted > 0
        ? Math.max(0, Math.min(100, ((budgeted - spent) / budgeted) * 100 + 50))
        : income > 0
        ? Math.max(0, Math.min(100, (1 - spent / income) * 100))
        : 50;

    // Emergency fund months: balance / monthly expenses
    const monthlyExpense = spent > 0 ? spent : income * 0.6;
    const emergencyFundMonths =
      monthlyExpense > 0 ? emergency / monthlyExpense : 0;

    // Investment growth from input
    const investmentGrowth = parseFloat(fields.investmentGrowthPct) || undefined;

    // Diversification score from categories selected (0 = 0, 6 = 100)
    const diversificationScore =
      fields.portfolioCategories.length > 0
        ? Math.round((fields.portfolioCategories.length / CATEGORIES.length) * 100)
        : undefined;

    runEvaluation({
      data: {
        netWorth,
        savingsRate,
        budgetAdherence,
        emergencyFundMonths,
        investmentGrowth,
        diversificationScore,
      },
    });
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
    }
  }

  function handleReset() {
    setScreen("method");
    setResult(null);
    setError(null);
    setUploadedFile(null);
    setFields({
      netWorth: "",
      monthlyIncome: "",
      totalSaved: "",
      totalSpent: "",
      budgetedExpenses: "",
      emergencyFundBalance: "",
      investmentGrowthPct: "",
      portfolioCategories: [],
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl mx-4 bg-[#080d1a] border border-primary/40 hud-panel"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            {screen !== "method" && screen !== "result" && (
              <button
                onClick={() => setScreen("method")}
                className="text-primary/60 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-heading text-lg text-primary tracking-widest font-bold">
                MONTHLY EVALUATION
              </h2>
              <p className="text-[10px] font-mono text-primary/50 tracking-widest mt-0.5">
                {screen === "method" && "SELECT INPUT METHOD"}
                {screen === "upload" && "UPLOAD FINANCIAL STATEMENT"}
                {screen === "manual" && "MANUAL DATA ENTRY PROTOCOL"}
                {screen === "result" && "EVALUATION COMPLETE"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ── METHOD SELECTION ── */}
            {screen === "method" && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-xs font-mono text-primary/60 text-center mb-6">
                  HOW WOULD YOU LIKE TO SUBMIT THIS MONTH'S FINANCIAL DATA?
                </p>

                {/* Option 1: Upload */}
                <button
                  onClick={() => setScreen("upload")}
                  className="w-full group p-5 border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left relative"
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/60" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/60" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-primary/40 bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-heading text-primary tracking-widest font-bold">
                        UPLOAD STATEMENT
                      </div>
                      <div className="text-xs font-mono text-primary/50 mt-1">
                        Upload a bank or salary statement. Review extracted data before submission.
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                </button>

                {/* Option 2: Manual */}
                <button
                  onClick={() => setScreen("manual")}
                  className="w-full group p-5 border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all text-left relative"
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/60" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/60" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-primary/40 bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                      <ClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-heading text-primary tracking-widest font-bold">
                        ADD MANUALLY
                      </div>
                      <div className="text-xs font-mono text-primary/50 mt-1">
                        Enter this month's financial data directly. Full control over all metrics.
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              </motion.div>
            )}

            {/* ── UPLOAD SCREEN ── */}
            {screen === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed cursor-pointer transition-all p-12 text-center ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className="w-10 h-10 text-primary/50 mx-auto mb-4" />
                    <p className="font-heading text-primary/70 tracking-widest text-sm">
                      DROP STATEMENT HERE
                    </p>
                    <p className="text-xs font-mono text-primary/40 mt-2">
                      PDF, CSV, PNG, JPG — or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.csv,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setUploadedFile(e.target.files[0]);
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-mono text-sm text-primary">{uploadedFile.name}</p>
                        <p className="text-[10px] text-primary/50 font-mono">
                          {(uploadedFile.size / 1024).toFixed(1)} KB — FILE RECEIVED
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="text-primary/40 hover:text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="border border-warning/30 bg-warning/5 p-3 text-center">
                  <p className="text-[10px] font-mono text-warning/80">
                    AUTO-EXTRACTION NOT AVAILABLE YET. PLEASE REVIEW AND FILL IN YOUR DETAILS BELOW.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setScreen("manual")}
                  disabled={!uploadedFile}
                >
                  PROCEED TO MANUAL REVIEW
                </Button>
              </motion.div>
            )}

            {/* ── MANUAL FORM ── */}
            {screen === "manual" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {error && (
                  <div className="border border-destructive/50 bg-destructive/10 p-3 text-center">
                    <p className="text-xs font-mono text-destructive">{error}</p>
                  </div>
                )}

                {/* SECTION 1: Net Worth */}
                <div>
                  <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 border-b border-primary/10 pb-1">
                    ◈ CURRENT FINANCIAL POSITION
                  </div>
                  <div className="space-y-3">
                    <FieldRow
                      label="TOTAL NET WORTH"
                      hint="Current assets minus liabilities"
                      required
                      prefix="₹"
                      value={fields.netWorth}
                      onChange={(v) => setField("netWorth", v)}
                      type="number"
                    />
                  </div>
                </div>

                {/* SECTION 2: Monthly Cash Flow */}
                <div>
                  <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 border-b border-primary/10 pb-1">
                    ◈ THIS MONTH'S CASH FLOW
                  </div>
                  <div className="space-y-3">
                    <FieldRow
                      label="MONTHLY INCOME"
                      hint="Salary + side income"
                      prefix="₹"
                      value={fields.monthlyIncome}
                      onChange={(v) => setField("monthlyIncome", v)}
                      type="number"
                    />
                    <FieldRow
                      label="TOTAL SAVED"
                      hint="Amount transferred to savings/investments"
                      prefix="₹"
                      value={fields.totalSaved}
                      onChange={(v) => setField("totalSaved", v)}
                      type="number"
                    />
                    <FieldRow
                      label="TOTAL SPENT"
                      hint="All expenses including bills, food, EMIs"
                      prefix="₹"
                      value={fields.totalSpent}
                      onChange={(v) => setField("totalSpent", v)}
                      type="number"
                    />
                    <FieldRow
                      label="MONTHLY BUDGET"
                      hint="Your planned spending limit for the month"
                      prefix="₹"
                      value={fields.budgetedExpenses}
                      onChange={(v) => setField("budgetedExpenses", v)}
                      type="number"
                    />
                  </div>
                </div>

                {/* SECTION 3: Emergency Fund */}
                <div>
                  <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 border-b border-primary/10 pb-1">
                    ◈ EMERGENCY FUND
                  </div>
                  <FieldRow
                    label="EMERGENCY FUND BALANCE"
                    hint="Total in liquid emergency savings"
                    prefix="₹"
                    value={fields.emergencyFundBalance}
                    onChange={(v) => setField("emergencyFundBalance", v)}
                    type="number"
                  />
                </div>

                {/* SECTION 4: Investments */}
                <div>
                  <div className="text-[10px] font-mono text-primary/50 tracking-widest mb-3 border-b border-primary/10 pb-1">
                    ◈ INVESTMENT PERFORMANCE (OPTIONAL)
                  </div>
                  <div className="space-y-3">
                    <FieldRow
                      label="INVESTMENT GROWTH"
                      hint="Portfolio return this month in %"
                      suffix="%"
                      value={fields.investmentGrowthPct}
                      onChange={(v) => setField("investmentGrowthPct", v)}
                      type="number"
                      placeholder="e.g. 3.5"
                    />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-primary/70 tracking-widest uppercase">
                          ACTIVE ASSET CATEGORIES
                        </label>
                        <span className="text-[10px] font-mono text-primary/40">
                          {fields.portfolioCategories.length}/{CATEGORIES.length} selected
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map((cat) => {
                          const active = fields.portfolioCategories.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => toggleCategory(cat)}
                              className={`px-2 py-1.5 text-[10px] font-mono tracking-wider border transition-all ${
                                active
                                  ? "border-primary bg-primary/20 text-primary"
                                  : "border-primary/20 bg-transparent text-primary/40 hover:border-primary/40 hover:text-primary/70"
                              }`}
                            >
                              {active ? "◆" : "◇"} {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={computeAndSubmit}
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2 font-mono">
                      <span className="animate-pulse">CALCULATING XP GAINS...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" /> SUBMIT EVALUATION
                    </span>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── RESULT ── */}
            {screen === "result" && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center py-4"
              >
                {result.leveledUp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-warning/60 bg-warning/10 px-4 py-3"
                  >
                    <p className="font-heading text-warning tracking-widest text-lg font-bold">
                      ⚡ LEVEL UP
                    </p>
                    <p className="font-mono text-warning/70 text-sm mt-1">
                      YOU ARE NOW LEVEL {result.newLevel}
                    </p>
                  </motion.div>
                )}

                <div className="border border-primary/30 bg-primary/5 p-8">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="font-heading text-primary tracking-widest text-2xl font-bold">
                    +{result.xpGained} XP
                  </p>
                  <p className="font-mono text-primary/60 text-sm mt-2">
                    EVALUATION PROCESSED. STATS UPDATED.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-primary/20 bg-primary/5 p-4">
                    <p className="text-[10px] font-mono text-primary/50 tracking-widest">CURRENT LEVEL</p>
                    <p className="text-2xl font-heading font-bold text-primary mt-1">{result.newLevel}</p>
                  </div>
                  <div className="border border-primary/20 bg-primary/5 p-4">
                    <p className="text-[10px] font-mono text-primary/50 tracking-widest">TOTAL XP</p>
                    <p className="text-2xl font-heading font-bold text-primary mt-1">{result.newXp.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleReset}>
                    RUN ANOTHER
                  </Button>
                  <Button className="flex-1" onClick={onClose}>
                    CLOSE TERMINAL
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  value,
  onChange,
  type = "text",
  required = false,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-[10px] font-mono text-primary/70 tracking-widest uppercase">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {hint && <span className="text-[10px] font-mono text-primary/30">{hint}</span>}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 font-mono text-sm text-primary/50">{prefix}</span>
        )}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          className={`font-mono bg-black/40 border-primary/20 focus:border-primary h-9 ${
            prefix ? "pl-8" : ""
          } ${suffix ? "pr-8" : ""}`}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
        />
        {suffix && (
          <span className="absolute right-3 font-mono text-sm text-primary/50">{suffix}</span>
        )}
      </div>
    </div>
  );
}
