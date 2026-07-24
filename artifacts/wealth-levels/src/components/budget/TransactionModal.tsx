import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface TxRow {
  id?: number;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface Props {
  open: boolean;
  initial?: TxRow | null;
  categories: string[];
  onClose: () => void;
  onSave: (tx: TxRow & { id?: number }) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ open, initial, categories, onClose, onSave }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "expense");
    setCategory(initial?.category ?? "");
    setCustomCat("");
    setDescription(initial?.description ?? "");
    setAmount(initial?.amount ? String(initial.amount) : "");
    setDate(initial?.date ?? today());
    setError(null);
  }, [open, initial]);

  async function handleSave() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    const cat = category === "__custom__" ? customCat.trim() : category.trim();
    if (!cat) { setError("Select or enter a category."); return; }
    if (!date) { setError("Pick a date."); return; }

    setSaving(true);
    setError(null);
    try {
      const body = { type, category: cat, description: description.trim(), amount: amt, date };
      const url = initial?.id
        ? `${BASE_URL}/api/budget/transactions/${initial.id}`
        : `${BASE_URL}/api/budget/transactions`;
      const res = await fetch(url, {
        method: initial?.id ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch (e) {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const allCats = [...new Set([...categories, category])].filter(c => c && c !== "__custom__");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-[#080d1a] border border-primary/40 p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm tracking-widest text-primary">
                  {initial?.id ? "EDIT TRANSACTION" : "LOG TRANSACTION"}
                </span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2 border font-mono text-xs tracking-widest transition-colors
                    ${type === t
                      ? t === "income"
                        ? "border-green-400/60 bg-green-400/10 text-green-400"
                        : "border-red-400/60 bg-red-400/10 text-red-400"
                      : "border-primary/20 bg-transparent text-primary/40 hover:border-primary/40"
                    }`}
                >
                  {t === "income" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">CATEGORY</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60"
                >
                  <option value="">— Select category —</option>
                  {type === "income" && <option value="Salary">Salary</option>}
                  {type === "income" && <option value="Freelance">Freelance</option>}
                  {type === "income" && <option value="Business">Business</option>}
                  {type === "income" && <option value="Investment Returns">Investment Returns</option>}
                  {allCats.filter(c => !["Salary","Freelance","Business","Investment Returns"].includes(c)).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">+ Custom…</option>
                </select>
                {category === "__custom__" && (
                  <input
                    value={customCat}
                    onChange={e => setCustomCat(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60 placeholder:text-primary/30"
                  />
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">NOTE (OPTIONAL)</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. EMI, groceries…"
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60 placeholder:text-primary/30"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">AMOUNT (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60 placeholder:text-primary/30"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">DATE</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60"
                />
              </div>
            </div>

            {error && (
              <p className="text-[10px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2">
                ⚠ {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>CANCEL</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "SAVING..." : "SAVE"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
