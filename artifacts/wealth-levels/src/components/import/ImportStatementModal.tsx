/**
 * Standalone statement import modal for use in BudgetTab and WealthTab.
 * Handles the full upload → parse → preview → apply flow without tying
 * into the evaluation protocol.
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBudgetQueryKey, getGetWealthQueryKey } from "@workspace/api-client-react";
import ParsePreview, { type ParseResult } from "./ParsePreview";

type Screen = "upload" | "preview" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportStatementModal({ open, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedSummary, setAppliedSummary] = useState<{ income: number; categories: number; assets: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  function handleReset() {
    setScreen("upload");
    setUploadedFile(null);
    setParseResult(null);
    setError(null);
    setAppliedSummary(null);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  }

  async function handleParse() {
    if (!uploadedFile) return;
    setIsParsing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("statement", uploadedFile);
      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Server error ${res.status}`);
      }
      const data: ParseResult = await res.json();
      setParseResult(data);
      setScreen("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "PARSE FAILED");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleApply(data: {
    budget: { monthlyIncome: number; items: any[] };
    wealth: { assets: any[] };
  }) {
    setIsApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Server error ${res.status}`);
      }
      // Invalidate both queries so tabs refresh
      qc.invalidateQueries({ queryKey: getGetBudgetQueryKey() });
      qc.invalidateQueries({ queryKey: getGetWealthQueryKey() });
      setAppliedSummary({
        income: data.budget.monthlyIncome,
        categories: data.budget.items.length,
        assets: data.wealth.assets.length,
      });
      setScreen("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "APPLY FAILED");
    } finally {
      setIsApplying(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative bg-background border border-primary/40 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,200,255,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-primary/20 p-4 flex items-center justify-between z-10">
          <div>
            <p className="font-heading text-primary tracking-[0.2em] text-sm">
              {screen === "upload" && "IMPORT BANK STATEMENT"}
              {screen === "preview" && "REVIEW EXTRACTED DATA"}
              {screen === "done" && "IMPORT COMPLETE"}
            </p>
            {screen === "preview" && (
              <button
                onClick={() => setScreen("upload")}
                className="text-[10px] font-mono text-primary/40 hover:text-primary/70 transition-colors mt-0.5"
              >
                ← BACK
              </button>
            )}
          </div>
          <button onClick={handleClose} className="text-primary/40 hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* ── Upload ── */}
            {screen === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-xs font-mono text-primary/50">
                  Upload a CSV export from your bank's netbanking portal, or a PDF statement.
                  Supported banks: HDFC · ICICI · SBI · Axis · Kotak · Yes · IndusInd.
                </p>

                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed cursor-pointer transition-all p-10 text-center ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-primary/50 mx-auto mb-3" />
                    <p className="font-heading text-primary/70 tracking-widest text-xs">DROP STATEMENT HERE</p>
                    <p className="text-[10px] font-mono text-primary/40 mt-1">PDF or CSV · max 10 MB · click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.csv,.txt"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]); }}
                    />
                  </div>
                ) : (
                  <div className="border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <div>
                        <p className="font-mono text-xs text-primary">{uploadedFile.name}</p>
                        <p className="text-[10px] font-mono text-primary/50">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="text-primary/40 hover:text-primary">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="border border-destructive/40 bg-destructive/10 p-3 text-center">
                    <p className="text-[10px] font-mono text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!uploadedFile || isParsing}
                  onClick={handleParse}
                >
                  {isParsing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> ANALYSING...
                    </span>
                  ) : (
                    "PARSE STATEMENT"
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── Preview ── */}
            {screen === "preview" && parseResult && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {error && (
                  <div className="border border-destructive/40 bg-destructive/10 p-3 mb-4 text-center">
                    <p className="text-[10px] font-mono text-destructive">{error}</p>
                  </div>
                )}
                <ParsePreview
                  result={parseResult}
                  applyLabel="APPLY TO BUDGET & WEALTH"
                  isApplying={isApplying}
                  onApply={(data) => handleApply(data)}
                  onSkip={handleClose}
                />
              </motion.div>
            )}

            {/* ── Done ── */}
            {screen === "done" && appliedSummary && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <CheckCircle className="w-10 h-10 text-success mx-auto" />
                <div>
                  <p className="font-heading text-primary tracking-widest text-sm">IMPORT COMPLETE</p>
                  <p className="text-xs font-mono text-primary/50 mt-1">BUDGET AND WEALTH UPDATED</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "INCOME", value: `₹${appliedSummary.income.toLocaleString("en-IN")}` },
                    { label: "CATEGORIES", value: String(appliedSummary.categories) },
                    { label: "ASSETS", value: String(appliedSummary.assets) },
                  ].map(({ label, value }) => (
                    <div key={label} className="border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[9px] font-mono text-primary/40 mb-1">{label}</p>
                      <p className="text-sm font-mono text-primary">{value}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full" onClick={handleClose}>CLOSE</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
