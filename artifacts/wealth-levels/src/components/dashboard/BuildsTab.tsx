/**
 * BuildsTab — "Dungeons" panel.
 * Each Build is an income source / side-hustle tracked as a dungeon raid.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBuilds,
  useCreateBuild,
  useUpdateBuild,
  useDeleteBuild,
  getListBuildsQueryKey,
} from "@workspace/api-client-react";
import type { Build } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Swords,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  IndentIncrease,
  DollarSign,
} from "lucide-react";

// ─── Rank colours (matching the rest of the HUD) ────────────────────────────

const RANK_CLASSES: Record<string, string> = {
  S: "border-yellow-400/60 text-yellow-300 bg-yellow-400/10",
  A: "border-violet-400/60 text-violet-300 bg-violet-400/10",
  B: "border-blue-400/60 text-blue-300 bg-blue-400/10",
  C: "border-cyan-400/60 text-cyan-300 bg-cyan-400/10",
  D: "border-green-400/60 text-green-300 bg-green-400/10",
  E: "border-zinc-400/40 text-zinc-400 bg-zinc-400/5",
};

const RANKS = ["S", "A", "B", "C", "D", "E"] as const;

// ─── Create / Edit Dialog ────────────────────────────────────────────────────

interface BuildDialogProps {
  open: boolean;
  initial?: Build;
  onOpenChange: (v: boolean) => void;
}

function BuildDialog({ open, initial, onOpenChange }: BuildDialogProps) {
  const qc = useQueryClient();
  const createMut = useCreateBuild();
  const updateMut = useUpdateBuild();
  const isEdit = !!initial;

  const [name, setName]           = useState(initial?.name ?? "");
  const [description, setDesc]    = useState(initial?.description ?? "");
  const [rank, setRank]           = useState<string>(initial?.rank ?? "D");
  const [revenue, setRevenue]     = useState(initial?.revenue != null ? String(initial.revenue) : "");
  const [expenses, setExpenses]   = useState(initial?.expenses != null ? String(initial.expenses) : "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  function reset() {
    setName(""); setDesc(""); setRank("D"); setRevenue(""); setExpenses(""); setError("");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        rank: rank as any,
        revenue: revenue ? parseFloat(revenue) : 0,
        expenses: expenses ? parseFloat(expenses) : 0,
      };

      if (isEdit) {
        await updateMut.mutateAsync({ id: initial!.id, data: payload });
      } else {
        await createMut.mutateAsync({ data: payload });
      }

      qc.invalidateQueries({ queryKey: getListBuildsQueryKey() });
      handleClose(false);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border-primary/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary tracking-widest hud-glow text-xl">
            {isEdit ? "MODIFY DUNGEON" : "NEW DUNGEON RAID"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">DUNGEON NAME *</Label>
            <Input
              placeholder="e.g. Freelance Design Work"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">DESCRIPTION</Label>
            <Textarea
              placeholder="What income source is this? How does it work?"
              value={description}
              onChange={e => setDesc(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">RANK</Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map(r => (
                    <SelectItem key={r} value={r}>{r}-RANK</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">REVENUE (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">EXPENSES (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={expenses}
                onChange={e => setExpenses(e.target.value)}
              />
            </div>
          </div>

          {/* Live profit preview */}
          {(revenue || expenses) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 font-mono text-xs">
              <span className="text-muted-foreground tracking-widest">NET PROFIT:</span>
              <span className={
                (parseFloat(revenue || "0") - parseFloat(expenses || "0")) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }>
                ₹{((parseFloat(revenue || "0") - parseFloat(expenses || "0"))).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {error && <p className="text-xs font-mono text-destructive tracking-wide">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>CANCEL</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "SAVING…" : isEdit ? "UPDATE DUNGEON" : "CREATE DUNGEON"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Build Card ──────────────────────────────────────────────────────────────

interface BuildCardProps {
  build: Build;
  onEdit: (b: Build) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}

function BuildCard({ build, onEdit, onDelete, deleting }: BuildCardProps) {
  const profit = build.netProfit ?? (build.revenue - build.expenses);
  const rankCls = RANK_CLASSES[build.rank] ?? RANK_CLASSES["E"];

  return (
    <Card className="bg-black/30 border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`font-mono text-[10px] border ${rankCls}`}>
                {build.rank}
              </Badge>
              <span className="font-heading text-sm text-foreground tracking-wide truncate">
                {build.name}
              </span>
            </div>
            {build.description && (
              <p className="text-[11px] font-mono text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {build.description}
              </p>
            )}

            {/* Financials strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 text-green-400" /> REVENUE
                </span>
                <span className="text-xs font-mono text-green-400">
                  ₹{build.revenue.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                  <TrendingDown className="w-2.5 h-2.5 text-red-400" /> EXPENSES
                </span>
                <span className="text-xs font-mono text-red-400">
                  ₹{build.expenses.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                  <DollarSign className="w-2.5 h-2.5 text-primary" /> PROFIT
                </span>
                <span className={`text-xs font-mono font-bold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                  ₹{profit.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-primary/20 hover:border-primary/60"
              onClick={() => onEdit(build)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 border-destructive/20 hover:border-destructive/60 hover:text-destructive"
              disabled={deleting}
              onClick={() => onDelete(build.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

export default function BuildsTab() {
  const qc = useQueryClient();
  const { data: builds, isLoading } = useListBuilds();
  const deleteMut = useDeleteBuild();

  const [showCreate, setShowCreate] = useState(false);
  const [editBuild, setEditBuild]   = useState<Build | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Remove this dungeon?")) return;
    setDeletingId(id);
    try {
      await deleteMut.mutateAsync({ id });
      qc.invalidateQueries({ queryKey: getListBuildsQueryKey() });
    } finally {
      setDeletingId(null);
    }
  }

  // Summary stats
  const totalRevenue  = builds?.reduce((s, b) => s + b.revenue, 0) ?? 0;
  const totalExpenses = builds?.reduce((s, b) => s + b.expenses, 0) ?? 0;
  const totalProfit   = totalRevenue - totalExpenses;

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow flex items-center gap-2">
            <Swords className="w-6 h-6" /> DUNGEON RAIDS
          </h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            Track income sources · Measure each build's profit
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> NEW DUNGEON
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "TOTAL REVENUE",  value: totalRevenue,  color: "text-green-400" },
          { label: "TOTAL EXPENSES", value: totalExpenses, color: "text-red-400"   },
          { label: "NET PROFIT",     value: totalProfit,   color: totalProfit >= 0 ? "text-primary" : "text-destructive" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-primary/5 border border-primary/10 text-center">
            <p className={`text-lg font-heading font-bold ${color}`}>
              ₹{value.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Build list */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary/50 font-mono text-sm tracking-widest hud-cursor">SCANNING DUNGEONS…</p>
        </div>
      ) : !builds || builds.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-primary/20 p-10">
          <Swords className="w-10 h-10 text-primary/20" />
          <div className="text-center">
            <p className="font-mono text-sm text-muted-foreground tracking-widest">NO DUNGEONS ACTIVE</p>
            <p className="text-[11px] font-mono text-muted-foreground/50 mt-1">Create a dungeon to track an income source or side hustle.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> ENTER FIRST DUNGEON
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start pb-2">
          {builds.map(b => (
            <BuildCard
              key={b.id}
              build={b}
              onEdit={setEditBuild}
              onDelete={handleDelete}
              deleting={deletingId === b.id}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <BuildDialog open={showCreate} onOpenChange={setShowCreate} />
      {editBuild && (
        <BuildDialog
          open={true}
          initial={editBuild}
          onOpenChange={open => { if (!open) setEditBuild(null); }}
        />
      )}
    </div>
  );
}
