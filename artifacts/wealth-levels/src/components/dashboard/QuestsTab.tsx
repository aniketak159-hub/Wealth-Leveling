import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListQuests,
  useCreateQuest,
  useUpdateQuest,
  useDeleteQuest,
  useLogQuestProgress,
  getListQuestsQueryKey,
} from "@workspace/api-client-react";
import type { Quest, QuestDataLink } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Zap,
  Link2,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

const DATA_LINK_LABELS: Record<string, string> = {
  NET_WORTH:       "Net Worth (₹)",
  MONTHLY_SAVINGS: "Monthly Savings (₹)",
  TOTAL_EXPENSES:  "Total Expenses (₹)",
};

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ONGOING: "Ongoing",
};

const CATEGORY_COLORS: Record<string, string> = {
  SELF:   "border-l-cyan-400",
  SYSTEM: "border-l-violet-400",
};

// ─── Create Quest Dialog ──────────────────────────────────────────────────────

interface CreateQuestDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function CreateQuestDialog({ open, onOpenChange }: CreateQuestDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateQuest();

  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [category, setCategory]   = useState<"SELF" | "SYSTEM">("SELF");
  const [frequency, setFrequency] = useState<string>("ONGOING");
  const [xpReward, setXp]         = useState("100");
  const [targetAmount, setTarget] = useState("");
  const [dataLink, setDataLink]   = useState<string>("none");

  function reset() {
    setTitle(""); setDesc(""); setCategory("SELF");
    setFrequency("ONGOING"); setXp("100"); setTarget(""); setDataLink("none");
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (!title.trim()) return;

    const targetNum = targetAmount ? parseFloat(targetAmount) : undefined;
    const link = dataLink === "none" ? undefined : (dataLink as QuestDataLink);

    await createMutation.mutateAsync({
      data: {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        frequency: frequency as any,
        xpReward: parseInt(xpReward) || 100,
        targetAmount: targetNum,
        ...(link ? { dataLink: link } : {}),
      },
    });

    queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background border-primary/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary tracking-widest hud-glow text-xl">
            NEW MISSION DIRECTIVE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">QUEST TITLE *</Label>
            <Input
              placeholder="e.g. Build a ₹1L emergency fund"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-primary/5 border-primary/20 font-mono focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">DESCRIPTION</Label>
            <Textarea
              placeholder="What is this quest about? Why does it matter?"
              value={description}
              onChange={e => setDesc(e.target.value)}
              className="bg-primary/5 border-primary/20 font-mono text-sm resize-none h-20 focus:border-primary"
            />
          </div>

          {/* Category + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">CATEGORY</Label>
              <Select value={category} onValueChange={v => setCategory(v as any)}>
                <SelectTrigger className="bg-primary/5 border-primary/20 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/30">
                  <SelectItem value="SELF">⚔️ Self Quest</SelectItem>
                  <SelectItem value="SYSTEM">🖥️ System Quest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">FREQUENCY</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-primary/5 border-primary/20 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/30">
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* XP + Target Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">XP REWARD</Label>
              <Input
                type="number"
                min={0}
                placeholder="100"
                value={xpReward}
                onChange={e => setXp(e.target.value)}
                className="bg-primary/5 border-primary/20 font-mono focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest">TARGET AMOUNT (₹)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 100000"
                value={targetAmount}
                onChange={e => setTarget(e.target.value)}
                className="bg-primary/5 border-primary/20 font-mono focus:border-primary"
              />
            </div>
          </div>

          {/* Data Link */}
          {targetAmount && parseFloat(targetAmount) > 0 && (
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-primary/70 tracking-widest flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> SYNC PROGRESS WITH FINANCIAL DATA
              </Label>
              <Select value={dataLink} onValueChange={setDataLink}>
                <SelectTrigger className="bg-primary/5 border-primary/20 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/30">
                  <SelectItem value="none">Manual tracking only</SelectItem>
                  <SelectItem value="NET_WORTH">📊 Net Worth (auto-synced)</SelectItem>
                  <SelectItem value="MONTHLY_SAVINGS">💰 Monthly Savings (auto-synced)</SelectItem>
                  <SelectItem value="TOTAL_EXPENSES">📉 Total Expenses (auto-synced)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground font-mono">
                {dataLink !== "none"
                  ? "Progress will be automatically pulled from your live financial data."
                  : "You'll log progress manually using the +Progress button."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} className="font-mono border-primary/30">
            CANCEL
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createMutation.isPending}
            className="font-mono"
          >
            {createMutation.isPending ? "CREATING..." : "DEPLOY QUEST"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Log Progress Dialog ──────────────────────────────────────────────────────

interface LogProgressDialogProps {
  quest: Quest | null;
  onClose: () => void;
}

function LogProgressDialog({ quest, onClose }: LogProgressDialogProps) {
  const queryClient = useQueryClient();
  const progressMutation = useLogQuestProgress();
  const [amount, setAmount] = useState("");

  async function handleLog() {
    if (!quest || !amount) return;
    await progressMutation.mutateAsync({ id: quest.id, data: { amount: parseFloat(amount) } });
    queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
    setAmount("");
    onClose();
  }

  return (
    <Dialog open={!!quest} onOpenChange={v => { if (!v) { setAmount(""); onClose(); } }}>
      <DialogContent className="bg-background border-primary/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-primary tracking-widest hud-glow text-lg">
            LOG PROGRESS
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm font-mono text-muted-foreground truncate">{quest?.title}</p>
          {quest && quest.targetAmount !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>CURRENT</span>
                <span>₹{quest.currentAmount.toLocaleString()} / ₹{quest.targetAmount.toLocaleString()}</span>
              </div>
              <Progress value={(quest.currentAmount / quest.targetAmount) * 100} className="h-1.5" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-primary/70 tracking-widest">AMOUNT TO ADD (₹)</Label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-primary/5 border-primary/20 font-mono focus:border-primary"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="font-mono border-primary/30">CANCEL</Button>
          <Button onClick={handleLog} disabled={!amount || progressMutation.isPending} className="font-mono">
            {progressMutation.isPending ? "LOGGING..." : "LOG PROGRESS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quest Card ───────────────────────────────────────────────────────────────

interface QuestCardProps {
  quest: Quest;
  onLogProgress: (q: Quest) => void;
  onComplete: (q: Quest) => void;
  onReopen: (q: Quest) => void;
  onDelete: (q: Quest) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}

function QuestCard({ quest, onLogProgress, onComplete, onReopen, onDelete, isDeleting, isUpdating }: QuestCardProps) {
  const pct = quest.targetAmount && quest.targetAmount > 0
    ? Math.min(100, (quest.currentAmount / quest.targetAmount) * 100)
    : null;

  const borderColor = CATEGORY_COLORS[quest.category] ?? "border-l-primary";

  return (
    <Card className={`border-l-4 ${borderColor} bg-primary/5 hover:bg-primary/10 transition-colors`}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-heading text-base font-bold text-primary leading-tight">{quest.title}</h4>
            {quest.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{quest.description}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px] font-mono border-primary/40 text-primary/80">
            +{quest.xpReward} XP
          </Badge>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-mono">{quest.category}</Badge>
          <Badge variant="secondary" className="text-[10px] font-mono">{FREQ_LABELS[quest.frequency]}</Badge>
          {quest.dataLink && (
            <Badge className="text-[10px] font-mono bg-violet-500/20 text-violet-300 border-violet-500/30">
              <Link2 className="w-2.5 h-2.5 mr-1" />
              {DATA_LINK_LABELS[quest.dataLink]}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {pct !== null && (
          <div className="space-y-1.5 pt-1 border-t border-primary/15">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-muted-foreground">PROGRESS</span>
              <span className="text-primary">
                ₹{quest.currentAmount.toLocaleString()} / ₹{quest.targetAmount!.toLocaleString()}
                {quest.dataLink && <span className="text-violet-400 ml-1">• live</span>}
              </span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <p className="text-right text-[10px] font-mono text-primary/60">{pct.toFixed(1)}% COMPLETE</p>
          </div>
        )}

        {/* Actions */}
        {!quest.completed && (
          <div className="flex gap-2 pt-1">
            {quest.targetAmount !== null && !quest.dataLink && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLogProgress(quest)}
                className="text-[11px] font-mono border-primary/30 h-7 px-2.5"
              >
                <TrendingUp className="w-3 h-3 mr-1" /> LOG PROGRESS
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(quest)}
              disabled={isUpdating}
              className="text-[11px] font-mono border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 h-7 px-2.5"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> COMPLETE
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(quest)}
              disabled={isDeleting}
              className="text-[11px] font-mono text-red-400/60 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Completed state actions */}
        {quest.completed && (
          <div className="flex items-center justify-between pt-1 border-t border-primary/15">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {quest.completedAt
                ? `Completed ${new Date(quest.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : "Completed"}
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onReopen(quest)}
                className="text-[10px] font-mono text-muted-foreground hover:text-primary h-6 px-2"
              >
                <RotateCcw className="w-2.5 h-2.5 mr-1" /> REOPEN
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(quest)}
                disabled={isDeleting}
                className="text-[10px] font-mono text-red-400/40 hover:text-red-400 h-6 px-2"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quest Board ──────────────────────────────────────────────────────────────

interface QuestBoardProps {
  quests: Quest[];
  label: string;
  emptyText: string;
  onLogProgress: (q: Quest) => void;
  onComplete: (q: Quest) => void;
  onReopen: (q: Quest) => void;
  onDelete: (q: Quest) => void;
  deletingId: number | null;
  updatingId: number | null;
}

function QuestBoard({ quests, label, emptyText, onLogProgress, onComplete, onReopen, onDelete, deletingId, updatingId }: QuestBoardProps) {
  const active    = quests.filter(q => !q.completed);
  const completed = quests.filter(q => q.completed);

  return (
    <div className="space-y-4">
      {/* Active */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-primary/20 pb-1.5">
          <h3 className="font-heading text-sm tracking-widest text-primary/80">ACTIVE DIRECTIVES</h3>
          <span className="text-[10px] font-mono text-muted-foreground">{active.length} ACTIVE</span>
        </div>
        {active.length > 0 ? (
          active.map(q => (
            <QuestCard
              key={q.id}
              quest={q}
              onLogProgress={onLogProgress}
              onComplete={onComplete}
              onReopen={onReopen}
              onDelete={onDelete}
              isDeleting={deletingId === q.id}
              isUpdating={updatingId === q.id}
            />
          ))
        ) : (
          <div className="text-center p-6 border border-dashed border-primary/20 text-muted-foreground font-mono text-xs">
            {emptyText}
          </div>
        )}
      </div>

      {/* Completed log */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-primary/10 pb-1.5">
            <h3 className="font-heading text-sm tracking-widest text-primary/40">ARCHIVED — COMPLETED</h3>
            <span className="text-[10px] font-mono text-muted-foreground">{completed.length} ARCHIVED</span>
          </div>
          {completed.map(q => (
            <QuestCard
              key={q.id}
              quest={q}
              onLogProgress={onLogProgress}
              onComplete={onComplete}
              onReopen={onReopen}
              onDelete={onDelete}
              isDeleting={deletingId === q.id}
              isUpdating={updatingId === q.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function QuestsTab() {
  const queryClient = useQueryClient();
  const { data: quests, isLoading } = useListQuests();
  const updateMutation = useUpdateQuest();
  const deleteMutation = useDeleteQuest();

  const [showCreate, setShowCreate]       = useState(false);
  const [progressQuest, setProgressQuest] = useState<Quest | null>(null);
  const [activeTab, setActiveTab]         = useState<"SELF" | "SYSTEM">("SELF");
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [updatingId, setUpdatingId]       = useState<number | null>(null);

  const selfQuests   = quests?.filter(q => q.category === "SELF")   ?? [];
  const systemQuests = quests?.filter(q => q.category === "SYSTEM") ?? [];
  const displayed    = activeTab === "SELF" ? selfQuests : systemQuests;

  async function handleComplete(q: Quest) {
    setUpdatingId(q.id);
    try {
      await updateMutation.mutateAsync({ id: q.id, data: { completed: true } });
      queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReopen(q: Quest) {
    setUpdatingId(q.id);
    try {
      await updateMutation.mutateAsync({ id: q.id, data: { completed: false, completedAt: null } });
      queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(q: Quest) {
    setDeletingId(q.id);
    try {
      await deleteMutation.mutateAsync({ id: q.id });
      queryClient.invalidateQueries({ queryKey: getListQuestsQueryKey() });
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-primary font-mono hud-cursor">
        SCANNING ACTIVE MISSIONS...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow">MISSION LOG</h2>
          <p className="text-muted-foreground text-xs font-mono mt-1">
            Convert financial targets into actionable quests. Track real progress.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0 font-mono">
          <Plus className="w-4 h-4 mr-2" /> CREATE QUEST
        </Button>
      </div>

      {/* Board switcher */}
      <div className="flex gap-1 p-1 bg-primary/5 rounded-md border border-primary/20 w-fit">
        {(["SELF", "SYSTEM"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-mono tracking-widest rounded transition-all ${
              activeTab === tab
                ? "bg-primary text-background font-bold"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab === "SELF" ? "⚔️ SELF" : "🖥️ SYSTEM"}
            <span className={`ml-2 text-[10px] ${activeTab === tab ? "opacity-80" : "opacity-40"}`}>
              ({(tab === "SELF" ? selfQuests : systemQuests).length})
            </span>
          </button>
        ))}
      </div>

      {/* Board */}
      <QuestBoard
        quests={displayed}
        label={activeTab}
        emptyText={activeTab === "SELF"
          ? "NO SELF QUESTS YET — CREATE YOUR FIRST DIRECTIVE"
          : "NO SYSTEM QUESTS ASSIGNED"}
        onLogProgress={setProgressQuest}
        onComplete={handleComplete}
        onReopen={handleReopen}
        onDelete={handleDelete}
        deletingId={deletingId}
        updatingId={updatingId}
      />

      {/* Stats strip */}
      {quests && quests.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-primary/10">
          {[
            { label: "TOTAL XP AVAILABLE", value: quests.filter(q=>!q.completed).reduce((s,q)=>s+q.xpReward,0), icon: Zap },
            { label: "COMPLETED", value: quests.filter(q=>q.completed).length, icon: CheckCircle2 },
            { label: "LINKED TO DATA", value: quests.filter(q=>q.dataLink).length, icon: Link2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center p-3 bg-primary/5 rounded border border-primary/10">
              <Icon className="w-4 h-4 mx-auto text-primary/60 mb-1" />
              <p className="text-lg font-heading font-bold text-primary">{value}</p>
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateQuestDialog open={showCreate} onOpenChange={setShowCreate} />
      <LogProgressDialog quest={progressQuest} onClose={() => setProgressQuest(null)} />
    </div>
  );
}
