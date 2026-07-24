import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CategoryRow {
  id?: number;
  label: string;
  planned: number;
}

interface Props {
  open: boolean;
  initial?: CategoryRow | null;
  onClose: () => void;
  onSave: (row: CategoryRow) => void;
}

export default function CategoryModal({ open, initial, onClose, onSave }: Props) {
  const [label, setLabel] = useState("");
  const [planned, setPlanned] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(initial?.label ?? "");
    setPlanned(initial?.planned ? String(initial.planned) : "");
    setError(null);
  }, [open, initial]);

  function handleSave() {
    if (!label.trim()) { setError("Category name is required."); return; }
    const p = parseFloat(planned);
    if (isNaN(p) || p < 0) { setError("Enter a valid planned amount."); return; }
    onSave({ id: initial?.id, label: label.trim(), planned: p });
    onClose();
  }

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
            className="w-full max-w-sm bg-[#080d1a] border border-primary/40 p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm tracking-widest text-primary">
                  {initial?.id ? "EDIT CATEGORY" : "NEW CATEGORY"}
                </span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">CATEGORY NAME</label>
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Rent, Food, EMI…"
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60 placeholder:text-primary/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">PLANNED BUDGET (₹/MONTH)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planned}
                  onChange={e => setPlanned(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-primary/5 border border-primary/20 text-primary font-mono text-xs px-3 py-2 focus:outline-none focus:border-primary/60 placeholder:text-primary/30"
                />
              </div>
            </div>

            {error && (
              <p className="text-[10px] font-mono text-red-400 border border-red-400/30 bg-red-400/5 px-3 py-2">
                ⚠ {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose}>CANCEL</Button>
              <Button className="flex-1" onClick={handleSave}>SAVE</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
