/**
 * BuildsTab — "Dungeons" panel.
 * Each Build is an income source / side-hustle tracked as a dungeon raid.
 * Supports ACTIVE | ON_HOLD | CLEARED status with inline toggle and filter.
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
import type { Build, BuildStatus } from "@workspace/api-client-react";
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
  DollarSign,
  CheckCircle2,
  PauseCircle,
  Circle,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const RANK_CLASSES: Record<string, string> = {
  S: "border-yellow-400/60 text-yellow-300 bg-yellow-400/10",
  A: "border-violet-400/60 text-violet-300 bg-violet-400/10",
  B: "border-blue-400/60 text-blue-300 bg-blue-400/10",
  C: "border-cyan-400/60 text-cyan-300 bg-cyan-400/10",
  D: "border-green-400/60 text-green-300 bg-green-400/10",
  E: "border-zinc-400/40 text-zinc-400 bg-zinc-400/5",
};

const RANKS = ["S", "A", "B", "C", "D", "E"] as const;

type StatusValue = "ACTIVE" | "ON_HOLD" | "CLEARED";
const STATUS_CYCLE: StatusValue[] = ["ACTIVE", "ON_HOLD", "CLEARED"];

const STATUS_META: Record<StatusValue, {
  label: string;
  icon: React.FC<{ className?: string }>;
  badge: string;
  next: StatusValue;
}> = {
  ACTIVE:  { label: "ACTIVE",   icon: Circle,        badge: "border-primary/60 text-primary bg-primary/10",           next: "ON_HOLD"  },
  ON_HOLD: { label: "ON HOLD",  icon: PauseCircle,   badge: "border-yellow-400/60 text-yellow-300 bg-yellow-400/10",  next: "CLEARED"  },
  CLEARED: { label: "CLEARED",  icon: CheckCircle2,  badge: "border-zinc-400/40 text-zinc-400/60 bg-zinc-400/5",      next: "ACTIVE"   },
};

type FilterValue = "ALL" | StatusValue;

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

  const [name, setName]         = useState(initial?.name ?? "");
  const [description, setDesc]  = useState(initial?.description ?? "");
  const [rank, setRank]         = useState<string>(initial?.rank ?? "D");
  const [status, setStatus]     = useState<StatusValue>((initial?.status as StatusValue) ?? "ACTIVE");
  const [revenue, setRevenue]   = useState(initial?.revenue != null ? String(initial.revenue) : "");
  const [expenses, setExpenses] = useState(initial?.expenses != null ? String(initial.expenses) : "");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  function reset() {
    setName(""); setDesc(""); setRank("D"); setStatus("ACTIVE");
    setRevenue(""); setExpenses(""); setError("");
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
        status: status as BuildStatus,
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

  const liveProfit = (parseFloat(revenue || "0") - parseFloat(expenses || "0"));

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
            <Input placeholder="e.g. Freelance Design Work" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">DESCRIPTION</Label>
            <Textarea placeholder="What income source is this?" value={description} onChange={e => setDesc(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">RANK</Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANKS.map(r => <SelectItem key={r} value={r}>{r}-RANK</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">STATUS</Label>
              <Select value={status} onValueChange={v => setStatus(v as StatusValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CLEARED">Cleared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">REVENUE (₹)</Label>
              <Input type="number" min="0" placeholder="0" value={revenue} onChange={e => setRevenue(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">EXPENSES (₹)</Label>
            <Input type="number" min="0" placeholder="0" value={expenses} onChange={e => setExpenses(e.target.value)} />
          </div>

          {(revenue || expenses) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 font-mono text-xs">
              <span className="text-muted-foreground tracking-widest">NET PROFIT:</span>
              <span className={liveProfit >= 0 ? "text-green-400" : "text-red-400"}>
                ₹{liveProfit.toLocaleString("en-IN")}
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

// ─── Status Badge (inline, clickable to cycle) ───────────────────────────────

interface StatusBadgeProps {
  build: Build;
  onStatusChange: (id: number, next: StatusValue) => void;
  loading: boolean;
}

function StatusBadge({ build, onStatusChange, loading }: StatusBadgeProps) {
  const s = (build.status as StatusValue) ?? "ACTIVE";
  const meta = STATUS_META[s];
  const Icon = meta.icon;

  return (
    <button
      onClick={() => onStatusChange(build.id, meta.next)}
      disabled={loading}
      title={`Status: ${meta.label} — click to change`}
      className={`flex items-center gap-1 px-2 py-0.5 border text-[10px] font-mono tracking-widest uppercase transition-all hover:opacity-80 disabled:opacity-40 ${meta.badge}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {meta.label}
    </button>
  );
}

// ─── Build Card ──────────────────────────────────────────────────────────────

interface BuildCardProps {
  build: Build;
  onEdit: (b: Build) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, next: StatusValue) => void;
  deleting: boolean;
  statusChanging: boolean;
}

function BuildCard({ build, onEdit, onDelete, onStatusChange, deleting, statusChanging }: BuildCardProps) {
  const profit = build.netProfit ?? (build.revenue - build.expenses);
  const rankCls = RANK_CLASSES[build.rank] ?? RANK_CLASSES["E"];
  const isCleared = (build.status as StatusValue) === "CLEARED";

  return (
    <Card className={`border-primary/20 transition-colors ${isCleared ? "bg-black/10 opacity-60" : "bg-black/30 hover:border-primary/40"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`font-mono text-[10px] border ${rankCls}`}>{build.rank}</Badge>
              <span className={`font-heading text-sm tracking-wide truncate ${isCleared ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {build.name}
              </span>
            </div>

            {/* Status badge */}
            <div className="mb-2">
              <StatusBadge build={build} onStatusChange={onStatusChange} loading={statusChanging} />
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
                <span className="text-xs font-mono text-green-400">₹{build.revenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono text-muted-foreground tracking-widest flex items-center gap-1">
                  <TrendingDown className="w-2.5 h-2.5 text-red-400" /> EXPENSES
                </span>
                <span className="text-xs font-mono text-red-400">₹{build.expenses.toLocaleString("en-IN")}</span>
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

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button variant="outline" size="icon" className="h-7 w-7 border-primary/20 hover:border-primary/60"
              onClick={() => onEdit(build)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="icon"
              className="h-7 w-7 border-destructive/20 hover:border-destructive/60 hover:text-destructive"
              disabled={deleting} onClick={() => onDelete(build.id)}>
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
  const updateMut = useUpdateBuild();
  const deleteMut = useDeleteBuild();

  const [filter, setFilter]         = useState<FilterValue>("ACTIVE");
  const [showCreate, setShowCreate] = useState(false);
  const [editBuild, setEditBuild]   = useState<Build | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  async function handleStatusChange(id: number, next: StatusValue) {
    setChangingId(id);
    try {
      await updateMut.mutateAsync({ id, data: { status: next as BuildStatus } });
      qc.invalidateQueries({ queryKey: getListBuildsQueryKey() });
    } finally {
      setChangingId(null);
    }
  }

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

  // Filtered list
  const displayed = filter === "ALL"
    ? (builds ?? [])
    : (builds ?? []).filter(b => (b.status ?? "ACTIVE") === filter);

  // Stats from ACTIVE builds only
  const activeBuilds   = (builds ?? []).filter(b => (b.status ?? "ACTIVE") === "ACTIVE");
  const totalRevenue   = activeBuilds.reduce((s, b) => s + b.revenue, 0);
  const totalExpenses  = activeBuilds.reduce((s, b) => s + b.expenses, 0);
  const totalProfit    = totalRevenue - totalExpenses;

  // Status counts for filter pills
  const counts: Record<FilterValue, number> = {
    ALL:     builds?.length ?? 0,
    ACTIVE:  builds?.filter(b => (b.status ?? "ACTIVE") === "ACTIVE").length ?? 0,
    ON_HOLD: builds?.filter(b => b.status === "ON_HOLD").length ?? 0,
    CLEARED: builds?.filter(b => b.status === "CLEARED").length ?? 0,
  };

  const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
    { value: "ACTIVE",  label: "ACTIVE"   },
    { value: "ON_HOLD", label: "ON HOLD"  },
    { value: "CLEARED", label: "CLEARED"  },
    { value: "ALL",     label: "ALL"      },
  ];

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow flex items-center gap-2">
            <Swords className="w-6 h-6" /> DUNGEON RAIDS
          </h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            Track income sources · Mark each raid's status
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> NEW DUNGEON
        </Button>
      </div>

      {/* Stats strip — active builds only */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ACTIVE REVENUE",  value: totalRevenue,  color: "text-green-400" },
          { label: "ACTIVE EXPENSES", value: totalExpenses, color: "text-red-400"   },
          { label: "NET PROFIT",      value: totalProfit,   color: totalProfit >= 0 ? "text-primary" : "text-destructive" },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-3 bg-primary/5 border border-primary/10 text-center">
            <p className={`text-lg font-heading font-bold ${color}`}>₹{value.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border transition-all ${
              filter === value
                ? "bg-primary/20 border-primary text-primary"
                : "border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-60">({counts[value]})</span>
          </button>
        ))}
      </div>

      {/* Build list */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-primary/50 font-mono text-sm tracking-widest hud-cursor">SCANNING DUNGEONS…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-primary/20 p-10">
          <Swords className="w-10 h-10 text-primary/20" />
          <div className="text-center">
            {filter === "ALL" || !builds?.length ? (
              <>
                <p className="font-mono text-sm text-muted-foreground tracking-widest">NO DUNGEONS ACTIVE</p>
                <p className="text-[11px] font-mono text-muted-foreground/50 mt-1">Create a dungeon to track an income source or side hustle.</p>
              </>
            ) : (
              <p className="font-mono text-sm text-muted-foreground tracking-widest">NO {filter.replace("_", " ")} DUNGEONS</p>
            )}
          </div>
          {(!builds?.length) && (
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> ENTER FIRST DUNGEON
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start pb-2">
          {displayed.map(b => (
            <BuildCard
              key={b.id}
              build={b}
              onEdit={setEditBuild}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              deleting={deletingId === b.id}
              statusChanging={changingId === b.id}
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
