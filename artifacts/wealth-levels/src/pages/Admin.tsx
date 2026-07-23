import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useAdminGetStats,
  useAdminGetLeaderboard,
  useAdminListUsers,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminPushQuest,
  useAdminListBadges,
  useAdminCreateBadge,
  useAdminUpdateBadge,
  useAdminDeleteBadge,
  useAdminListMilestones,
  useAdminCreateMilestone,
  useAdminUpdateMilestone,
  useAdminDeleteMilestone,
  getAdminListBadgesQueryKey,
  getAdminListMilestonesQueryKey,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import type {
  AdminBadgeResponse,
  AdminMilestoneResponse,
  AdminUser,
  BadgeRarity,
  BadgeTriggerType,
  MilestoneCategory,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert, Users, Database, ArrowLeft, ChevronDown, ChevronUp,
  Trash2, Edit3, Send, Trophy, Target, Search, Plus, X, Check,
  Swords, Star, Zap, Shield,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TABS = ["OVERVIEW", "PLAYERS", "QUEST DISPATCH", "BADGES", "MILESTONES"] as const;
type Tab = typeof TABS[number];

const RARITY_COLORS: Record<BadgeRarity, string> = {
  COMMON: "text-muted-foreground border-muted-foreground/40 bg-muted/20",
  RARE: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  EPIC: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  LEGENDARY: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
};

const TRIGGER_LABELS: Record<BadgeTriggerType, string> = {
  QUEST_COUNT: "Quests Completed",
  SKILL_COUNT: "Skills Leveled",
  BUILD_COUNT: "Builds Created",
  NET_WORTH: "Net Worth (₹)",
  LEVEL: "Character Level",
  DAYS_ACTIVE: "Days Active",
  MANUAL: "Manual Award",
};

const MILESTONE_CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  QUEST: "text-primary border-primary/40",
  SKILL: "text-cyan-400 border-cyan-400/40",
  BUILD: "text-orange-400 border-orange-400/40",
  WEALTH: "text-yellow-400 border-yellow-400/40",
  CHARACTER: "text-purple-400 border-purple-400/40",
};

function RankBadge({ rank }: { rank?: string | null }) {
  const r = (rank ?? "E").toUpperCase();
  const colors: Record<string, string> = {
    S: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    A: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    B: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    C: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    D: "bg-green-500/20 text-green-400 border-green-500/40",
    E: "bg-muted/30 text-muted-foreground border-muted/40",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[r] ?? colors.E}`}>
      {r}
    </span>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats } = useAdminGetStats();
  const { data: leaderboard } = useAdminGetLeaderboard();
  const { data: users } = useAdminListUsers();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "TOTAL PLAYERS", val: stats?.totalUsers ?? 0, icon: Users },
          { label: "ACTIVE", val: stats?.activeUsers ?? 0, icon: Shield },
          { label: "AVG LEVEL", val: stats?.avgLevel?.toFixed(1) ?? "0", icon: Star },
          { label: "AVG NET WORTH", val: `₹${(stats?.avgNetWorth ?? 0).toLocaleString("en-IN")}`, icon: Zap },
          { label: "TOTAL QUESTS", val: stats?.totalQuests ?? 0, icon: Swords },
          { label: "TOTAL BUILDS", val: stats?.totalBuilds ?? 0, icon: Trophy },
        ].map(({ label, val, icon: Icon }) => (
          <Card key={label} className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <Icon className="w-3 h-3 text-destructive/60 mb-1" />
              <div className="text-[10px] text-muted-foreground font-mono mb-0.5">{label}</div>
              <div className="text-lg font-heading font-bold text-destructive truncate">{val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Trophy className="w-3 h-3" /> LEADERBOARD
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 text-[10px]">#</TableHead>
                  <TableHead className="text-[10px]">PLAYER</TableHead>
                  <TableHead className="text-right text-[10px]">LVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.slice(0, 10).map(e => (
                  <TableRow key={e.userId}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{e.rank}</TableCell>
                    <TableCell>
                      <div className="font-heading font-bold text-primary text-sm">{e.displayName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{e.tierRank || "E"}-RANK</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-primary text-sm">{e.level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <Database className="w-3 h-3" /> PLAYER DATABASE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">PLAYER</TableHead>
                  <TableHead className="text-[10px]">RANK</TableHead>
                  <TableHead className="text-right text-[10px] hidden sm:table-cell">NET WORTH</TableHead>
                  <TableHead className="text-right text-[10px] hidden sm:table-cell">Q/S/B</TableHead>
                  <TableHead className="text-[10px]">ROLE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-heading font-bold text-primary text-sm">{u.displayName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <RankBadge rank={u.rank} />
                        <span className="font-mono text-xs">Lv.{u.level}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-primary/80 hidden sm:table-cell">₹{u.netWorth.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono text-xs hidden sm:table-cell">{u.questCount}/{u.skillCount}/{u.buildCount}</TableCell>
                    <TableCell>
                      {u.isAdmin
                        ? <Badge variant="destructive" className="text-[10px] px-1">ADMIN</Badge>
                        : <Badge variant="outline" className="text-[10px] px-1">USER</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Players Tab ──────────────────────────────────────────────────────────────

function PlayersTab() {
  const qc = useQueryClient();
  const { data: users = [] } = useAdminListUsers();
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
  const pushQuest = useAdminPushQuest();

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pushQuestUserId, setPushQuestUserId] = useState<number | null>(null);
  const [questTitle, setQuestTitle] = useState("");
  const [questXP, setQuestXP] = useState("100");
  const [questFreq, setQuestFreq] = useState("ONGOING");
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = users.filter(u =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.clerkId.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setEditName(u.displayName);
    setEditIsAdmin(u.isAdmin);
  }

  async function saveEdit() {
    if (!editingId) return;
    await updateUser.mutateAsync({ id: String(editingId), data: { displayName: editName, isAdmin: editIsAdmin } });
    qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
    setEditingId(null);
  }

  async function confirmDelete(id: number) {
    await deleteUser.mutateAsync({ id: String(id) });
    qc.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
    setDeletingId(null);
    if (expandedId === id) setExpandedId(null);
  }

  async function handlePushQuest(userId: number) {
    if (!questTitle.trim()) return;
    const res = await pushQuest.mutateAsync({ data: { userId, title: questTitle, xpReward: parseInt(questXP) || 100, frequency: questFreq as "DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING" } });
    setSuccessMsg(res.message);
    setQuestTitle("");
    setPushQuestUserId(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="border border-primary/40 bg-primary/10 text-primary font-mono text-xs px-4 py-2 rounded flex items-center gap-2">
          <Check className="w-3 h-3" /> {successMsg}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="pl-9 h-8 text-xs font-mono"
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">{filtered.length} players</div>
      </div>

      <div className="border border-primary/20 rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/20">
              <TableHead className="text-[10px] w-8"></TableHead>
              <TableHead className="text-[10px]">PLAYER</TableHead>
              <TableHead className="text-[10px]">RANK</TableHead>
              <TableHead className="text-right text-[10px]">NET WORTH</TableHead>
              <TableHead className="text-right text-[10px]">Q / S / B</TableHead>
              <TableHead className="text-[10px]">ROLE</TableHead>
              <TableHead className="text-right text-[10px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <>
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-primary/5 border-primary/10"
                  onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                >
                  <TableCell className="text-muted-foreground">
                    {expandedId === u.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </TableCell>
                  <TableCell>
                    <div className="font-heading font-bold text-primary">{u.displayName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[140px]">{u.clerkId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RankBadge rank={u.rank} />
                      <span className="font-mono text-xs">Lv.{u.level}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-primary/80">
                    ₹{u.netWorth.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {u.questCount}/{u.skillCount}/{u.buildCount}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    {u.isAdmin
                      ? <Badge variant="destructive" className="text-[10px] px-1">ADMIN</Badge>
                      : <Badge variant="outline" className="text-[10px] px-1">USER</Badge>}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit" onClick={() => startEdit(u)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" title="Push Quest" onClick={() => { setPushQuestUserId(u.id); setExpandedId(u.id); }}>
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title="Delete" onClick={() => setDeletingId(u.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded row */}
                {expandedId === u.id && (
                  <TableRow key={`${u.id}-expanded`} className="bg-muted/5 border-primary/10">
                    <TableCell colSpan={7} className="p-4">
                      <div className="space-y-4">
                        {/* Edit form */}
                        {editingId === u.id && (
                          <div className="border border-primary/30 bg-primary/5 rounded p-4 space-y-3">
                            <div className="text-xs font-mono text-primary mb-2">// EDIT PLAYER</div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex-1 min-w-[180px]">
                                <label className="text-[10px] font-mono text-muted-foreground block mb-1">DISPLAY NAME</label>
                                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs font-mono" />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono text-muted-foreground block mb-1">ADMIN ACCESS</label>
                                <div className="flex items-center gap-2 h-7">
                                  <button
                                    onClick={() => setEditIsAdmin(!editIsAdmin)}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${editIsAdmin ? "bg-destructive" : "bg-muted"}`}
                                  >
                                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editIsAdmin ? "translate-x-4" : "translate-x-0.5"}`} />
                                  </button>
                                  <span className="text-xs font-mono text-muted-foreground">{editIsAdmin ? "ADMIN" : "USER"}</span>
                                </div>
                              </div>
                              <div className="flex items-end gap-2">
                                <Button size="sm" className="h-7 text-xs hud-button" onClick={saveEdit} disabled={updateUser.isPending}>
                                  <Check className="w-3 h-3 mr-1" /> SAVE
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                                  <X className="w-3 h-3 mr-1" /> CANCEL
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Push Quest mini-form */}
                        {pushQuestUserId === u.id && (
                          <div className="border border-primary/30 bg-primary/5 rounded p-4 space-y-3">
                            <div className="text-xs font-mono text-primary mb-2">// PUSH QUEST TO {u.displayName.toUpperCase()}</div>
                            <div className="flex items-end gap-3 flex-wrap">
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST TITLE</label>
                                <Input value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="Quest title..." className="h-7 text-xs font-mono" />
                              </div>
                              <div className="w-20">
                                <label className="text-[10px] font-mono text-muted-foreground block mb-1">XP REWARD</label>
                                <Input value={questXP} onChange={e => setQuestXP(e.target.value)} type="number" className="h-7 text-xs font-mono" />
                              </div>
                              <div className="w-28">
                                <label className="text-[10px] font-mono text-muted-foreground block mb-1">FREQUENCY</label>
                                <select
                                  value={questFreq}
                                  onChange={e => setQuestFreq(e.target.value)}
                                  className="h-7 w-full rounded border border-input bg-background px-2 text-xs font-mono"
                                >
                                  {["DAILY", "WEEKLY", "MONTHLY", "ONGOING"].map(f => <option key={f}>{f}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-xs hud-button" onClick={() => handlePushQuest(u.id)} disabled={pushQuest.isPending || !questTitle.trim()}>
                                  <Send className="w-3 h-3 mr-1" /> PUSH
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPushQuestUserId(null)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Stats summary */}
                        <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                          <div className="border border-primary/20 rounded p-2 text-center">
                            <div className="text-muted-foreground text-[10px]">LEVEL</div>
                            <div className="text-primary font-bold">{u.level}</div>
                          </div>
                          <div className="border border-primary/20 rounded p-2 text-center">
                            <div className="text-muted-foreground text-[10px]">XP</div>
                            <div className="text-primary font-bold">{u.xp.toLocaleString()}</div>
                          </div>
                          <div className="border border-primary/20 rounded p-2 text-center">
                            <div className="text-muted-foreground text-[10px]">NET WORTH</div>
                            <div className="text-primary font-bold">₹{u.netWorth.toLocaleString("en-IN")}</div>
                          </div>
                          <div className="border border-primary/20 rounded p-2 text-center">
                            <div className="text-muted-foreground text-[10px]">JOINED</div>
                            <div className="text-primary font-bold">{new Date(u.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Delete confirm */}
                {deletingId === u.id && (
                  <TableRow key={`${u.id}-delete`} className="bg-destructive/5 border-destructive/20">
                    <TableCell colSpan={7} className="py-2 px-4">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-destructive">⚠ DELETE {u.displayName.toUpperCase()}? THIS CANNOT BE UNDONE.</span>
                        <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => confirmDelete(u.id)} disabled={deleteUser.isPending}>
                          CONFIRM DELETE
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setDeletingId(null)}>
                          CANCEL
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Quest Dispatch Tab ───────────────────────────────────────────────────────

function QuestDispatchTab() {
  const { data: users = [] } = useAdminListUsers();
  const pushQuest = useAdminPushQuest();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"SYSTEM" | "SELF">("SYSTEM");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "ONGOING">("ONGOING");
  const [xpReward, setXpReward] = useState("150");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetMode, setTargetMode] = useState<"ALL" | "SPECIFIC">("ALL");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [result, setResult] = useState<{ pushed: number; message: string } | null>(null);
  const [error, setError] = useState("");

  async function handleDispatch() {
    if (!title.trim()) { setError("Quest title is required."); return; }
    setError("");
    try {
      const body: Parameters<typeof pushQuest.mutateAsync>[0]["data"] = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        frequency,
        xpReward: parseInt(xpReward) || 100,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        userId: targetMode === "SPECIFIC" && targetUserId ? parseInt(targetUserId) : undefined,
      };
      const res = await pushQuest.mutateAsync({ data: body });
      setResult(res);
      setTitle(""); setDescription(""); setTargetAmount("");
      setTimeout(() => setResult(null), 6000);
    } catch {
      setError("Dispatch failed. Check console.");
    }
  }

  const targetCount = targetMode === "ALL" ? users.length : 1;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="text-xs font-mono text-muted-foreground border-b border-primary/20 pb-2">
        // Craft a quest and push it directly to players. System quests appear in their quest log automatically.
      </div>

      {result && (
        <div className="border border-primary/40 bg-primary/10 rounded p-3 flex items-center gap-3">
          <Check className="w-4 h-4 text-primary" />
          <div>
            <div className="text-primary font-mono text-sm font-bold">DISPATCH SUCCESSFUL</div>
            <div className="text-muted-foreground font-mono text-xs">{result.message}</div>
          </div>
        </div>
      )}
      {error && (
        <div className="border border-destructive/40 bg-destructive/10 rounded p-3 text-destructive font-mono text-xs">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">QUEST TITLE *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Save ₹10,000 this month"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details about the quest..."
              rows={3}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">CATEGORY</label>
              <select value={category} onChange={e => setCategory(e.target.value as "SYSTEM" | "SELF")}
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                <option value="SYSTEM">SYSTEM</option>
                <option value="SELF">SELF</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">FREQUENCY</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as typeof frequency)}
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                {["DAILY", "WEEKLY", "MONTHLY", "ONGOING"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">XP REWARD</label>
              <Input value={xpReward} onChange={e => setXpReward(e.target.value)} type="number" className="font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">TARGET AMOUNT (₹)</label>
              <Input value={targetAmount} onChange={e => setTargetAmount(e.target.value)} type="number" placeholder="optional" className="font-mono" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-2">TARGET PLAYERS</label>
            <div className="space-y-2">
              {(["ALL", "SPECIFIC"] as const).map(mode => (
                <label key={mode} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${targetMode === mode ? "border-primary/50 bg-primary/10" : "border-primary/20 hover:bg-primary/5"}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${targetMode === mode ? "border-primary" : "border-muted-foreground"}`}>
                    {targetMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" value={mode} checked={targetMode === mode} onChange={() => setTargetMode(mode)} className="sr-only" />
                  <div>
                    <div className="text-xs font-mono font-bold">{mode === "ALL" ? "ALL PLAYERS" : "SPECIFIC PLAYER"}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {mode === "ALL" ? `Push to ${users.length} registered players` : "Select a single player to target"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {targetMode === "SPECIFIC" && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1.5">SELECT PLAYER</label>
              <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                <option value="">-- select --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.displayName} (Lv.{u.level})</option>)}
              </select>
            </div>
          )}

          {/* Preview card */}
          <div className="border border-primary/20 bg-primary/5 rounded p-4 space-y-2">
            <div className="text-[10px] font-mono text-muted-foreground">DISPATCH PREVIEW</div>
            <div className="font-heading font-bold text-primary text-sm">{title || "—"}</div>
            {description && <div className="text-xs text-muted-foreground font-mono">{description}</div>}
            <div className="flex gap-3 text-[10px] font-mono">
              <span className="text-primary/60">{category}</span>
              <span className="text-primary/60">{frequency}</span>
              <span className="text-yellow-400">{xpReward} XP</span>
              {targetAmount && <span className="text-muted-foreground">₹{parseFloat(targetAmount).toLocaleString("en-IN")}</span>}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground border-t border-primary/20 pt-2">
              → Sending to <span className="text-primary font-bold">{targetCount}</span> {targetCount === 1 ? "player" : "players"}
            </div>
          </div>

          <Button
            className="w-full hud-button"
            onClick={handleDispatch}
            disabled={pushQuest.isPending || !title.trim() || (targetMode === "SPECIFIC" && !targetUserId)}
          >
            <Send className="w-4 h-4 mr-2" />
            {pushQuest.isPending ? "DISPATCHING..." : `DISPATCH TO ${targetCount === users.length ? "ALL" : "1"} PLAYER${targetCount !== 1 ? "S" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Badges Tab ───────────────────────────────────────────────────────────────

const BADGE_TRIGGER_TYPES: BadgeTriggerType[] = ["QUEST_COUNT", "SKILL_COUNT", "BUILD_COUNT", "NET_WORTH", "LEVEL", "DAYS_ACTIVE", "MANUAL"];
const BADGE_RARITIES: BadgeRarity[] = ["COMMON", "RARE", "EPIC", "LEGENDARY"];

function BadgesTab() {
  const qc = useQueryClient();
  const { data: badges = [] } = useAdminListBadges();
  const createBadge = useAdminCreateBadge();
  const updateBadge = useAdminUpdateBadge();
  const deleteBadge = useAdminDeleteBadge();

  const emptyForm = { name: "", description: "", icon: "🏅", rarity: "COMMON" as BadgeRarity, triggerType: "MANUAL" as BadgeTriggerType, triggerValue: "0" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function startEdit(b: AdminBadgeResponse) {
    setEditingId(b.id);
    setForm({ name: b.name, description: b.description, icon: b.icon, rarity: b.rarity, triggerType: b.triggerType, triggerValue: String(b.triggerValue) });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description,
      icon: form.icon || "🏅",
      rarity: form.rarity,
      triggerType: form.triggerType,
      triggerValue: parseInt(form.triggerValue) || 0,
    };
    if (editingId) {
      await updateBadge.mutateAsync({ id: String(editingId), data: payload });
    } else {
      await createBadge.mutateAsync({ data: payload });
    }
    qc.invalidateQueries({ queryKey: getAdminListBadgesQueryKey() });
    cancelEdit();
  }

  async function handleDelete(id: number) {
    await deleteBadge.mutateAsync({ id: String(id) });
    qc.invalidateQueries({ queryKey: getAdminListBadgesQueryKey() });
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Badge grid */}
      {badges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {badges.map(b => (
            <div key={b.id} className={`border rounded p-3 relative group ${RARITY_COLORS[b.rarity]}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{b.icon}</span>
                <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded ${RARITY_COLORS[b.rarity]}`}>{b.rarity}</span>
              </div>
              <div className="font-heading font-bold text-sm mb-0.5">{b.name}</div>
              {b.description && <div className="text-[10px] font-mono opacity-70 mb-1.5">{b.description}</div>}
              <div className="text-[10px] font-mono opacity-60">
                {b.triggerType === "MANUAL" ? "Manual award" : `${TRIGGER_LABELS[b.triggerType]}: ${b.triggerValue.toLocaleString()}`}
              </div>
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button onClick={() => startEdit(b)} className="p-1 rounded hover:bg-black/20">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={() => setDeletingId(b.id)} className="p-1 rounded hover:bg-black/20 text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {deletingId === b.id && (
                <div className="absolute inset-0 bg-background/90 rounded flex flex-col items-center justify-center gap-2 p-3 border border-destructive/50">
                  <div className="text-[10px] font-mono text-destructive text-center">DELETE {b.name.toUpperCase()}?</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => handleDelete(b.id)} disabled={deleteBadge.isPending}>YES</Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setDeletingId(null)}>NO</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm border border-dashed border-primary/20 rounded">
          NO BADGES DEFINED YET — CREATE THE FIRST ONE BELOW
        </div>
      )}

      {/* Create / Edit form */}
      <div className="border border-primary/30 bg-primary/5 rounded p-5">
        <div className="text-xs font-mono text-primary mb-4">{editingId ? "// EDIT BADGE" : "// CREATE NEW BADGE"}</div>
        {error && <div className="text-destructive text-xs font-mono mb-3">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">NAME *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quest Champion" className="font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What earns this badge?" className="font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">ICON (EMOJI)</label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🏅" className="font-mono text-lg text-center" maxLength={4} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">RARITY</label>
                <select value={form.rarity} onChange={e => setForm(f => ({ ...f, rarity: e.target.value as BadgeRarity }))}
                  className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                  {BADGE_RARITIES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">TRIGGER TYPE</label>
              <select value={form.triggerType} onChange={e => setForm(f => ({ ...f, triggerType: e.target.value as BadgeTriggerType }))}
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                {BADGE_TRIGGER_TYPES.map(t => <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>)}
              </select>
            </div>
            {form.triggerType !== "MANUAL" && (
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                  TRIGGER VALUE ({TRIGGER_LABELS[form.triggerType]})
                </label>
                <Input value={form.triggerValue} onChange={e => setForm(f => ({ ...f, triggerValue: e.target.value }))} type="number" className="font-mono" />
              </div>
            )}
            {/* Preview */}
            <div className={`border rounded p-3 mt-2 ${RARITY_COLORS[form.rarity]}`}>
              <div className="text-[10px] font-mono opacity-60 mb-1">PREVIEW</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{form.icon || "🏅"}</span>
                <div>
                  <div className="font-heading font-bold text-sm">{form.name || "Badge Name"}</div>
                  <div className="text-[10px] font-mono opacity-70">{form.description || "No description"}</div>
                </div>
                <span className={`ml-auto text-[9px] font-mono border px-1.5 py-0.5 rounded ${RARITY_COLORS[form.rarity]}`}>{form.rarity}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button className="hud-button" onClick={handleSave} disabled={createBadge.isPending || updateBadge.isPending}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {editingId ? "UPDATE BADGE" : "CREATE BADGE"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit}>
              <X className="w-3.5 h-3.5 mr-1.5" /> CANCEL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────

const MILESTONE_CATEGORIES: MilestoneCategory[] = ["QUEST", "SKILL", "BUILD", "WEALTH", "CHARACTER"];

function MilestonesTab() {
  const qc = useQueryClient();
  const { data: milestones = [] } = useAdminListMilestones();
  const createMilestone = useAdminCreateMilestone();
  const updateMilestone = useAdminUpdateMilestone();
  const deleteMilestone = useAdminDeleteMilestone();

  const emptyForm = { name: "", description: "", icon: "🎯", category: "QUEST" as MilestoneCategory, threshold: "0", xpReward: "100" };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function startEdit(m: AdminMilestoneResponse) {
    setEditingId(m.id);
    setForm({ name: m.name, description: m.description, icon: m.icon, category: m.category, threshold: String(m.threshold), xpReward: String(m.xpReward) });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description,
      icon: form.icon || "🎯",
      category: form.category,
      threshold: parseFloat(form.threshold) || 0,
      xpReward: parseInt(form.xpReward) || 100,
    };
    if (editingId) {
      await updateMilestone.mutateAsync({ id: String(editingId), data: payload });
    } else {
      await createMilestone.mutateAsync({ data: payload });
    }
    qc.invalidateQueries({ queryKey: getAdminListMilestonesQueryKey() });
    cancelEdit();
  }

  async function handleDelete(id: number) {
    await deleteMilestone.mutateAsync({ id: String(id) });
    qc.invalidateQueries({ queryKey: getAdminListMilestonesQueryKey() });
    setDeletingId(null);
  }

  // Group by category
  const grouped = MILESTONE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = milestones.filter(m => m.category === cat);
    return acc;
  }, {} as Record<MilestoneCategory, AdminMilestoneResponse[]>);

  return (
    <div className="space-y-6">
      {/* Grouped milestones */}
      {milestones.length > 0 && (
        <div className="space-y-4">
          {MILESTONE_CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
            <div key={cat}>
              <div className={`text-[10px] font-mono mb-2 flex items-center gap-2 ${MILESTONE_CATEGORY_COLORS[cat]}`}>
                <div className="h-px flex-1 bg-current opacity-20" />
                {cat} MILESTONES ({grouped[cat].length})
                <div className="h-px flex-1 bg-current opacity-20" />
              </div>
              <div className="border border-primary/20 rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-12">ICON</TableHead>
                      <TableHead className="text-[10px]">NAME</TableHead>
                      <TableHead className="text-[10px]">DESCRIPTION</TableHead>
                      <TableHead className="text-right text-[10px]">THRESHOLD</TableHead>
                      <TableHead className="text-right text-[10px]">XP</TableHead>
                      <TableHead className="text-right text-[10px]">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[cat].map(m => (
                      <TableRow key={m.id} className="border-primary/10">
                        <TableCell className="text-xl">{m.icon}</TableCell>
                        <TableCell>
                          <div className="font-heading font-bold text-sm text-primary">{m.name}</div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{m.description || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {cat === "WEALTH" ? `₹${m.threshold.toLocaleString("en-IN")}` : m.threshold.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-yellow-400">{m.xpReward}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {deletingId === m.id ? (
                              <>
                                <span className="text-[10px] font-mono text-destructive mr-2">CONFIRM?</span>
                                <Button size="sm" variant="destructive" className="h-5 text-[9px] px-1.5" onClick={() => handleDelete(m.id)} disabled={deleteMilestone.isPending}>YES</Button>
                                <Button size="sm" variant="outline" className="h-5 text-[9px] px-1.5" onClick={() => setDeletingId(null)}>NO</Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(m)}>
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeletingId(m.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}

      {milestones.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-mono text-sm border border-dashed border-primary/20 rounded">
          NO MILESTONES DEFINED YET — CREATE THE FIRST ONE BELOW
        </div>
      )}

      {/* Create / Edit form */}
      <div className="border border-primary/30 bg-primary/5 rounded p-5">
        <div className="text-xs font-mono text-primary mb-4">{editingId ? "// EDIT MILESTONE" : "// CREATE NEW MILESTONE"}</div>
        {error && <div className="text-destructive text-xs font-mono mb-3">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">NAME *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quest Novice" className="font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this milestone represent?" className="font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">ICON (EMOJI)</label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🎯" className="font-mono text-lg text-center" maxLength={4} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">CATEGORY</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as MilestoneCategory }))}
                  className="w-full h-9 rounded border border-input bg-background px-2 text-sm font-mono">
                  {MILESTONE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">
                THRESHOLD {form.category === "WEALTH" ? "(₹)" : form.category === "CHARACTER" ? "(LEVEL)" : "(COUNT)"}
              </label>
              <Input value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} type="number" className="font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground block mb-1">XP REWARD</label>
              <Input value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: e.target.value }))} type="number" className="font-mono" />
            </div>
            {/* Preview */}
            <div className={`border rounded p-3 ${MILESTONE_CATEGORY_COLORS[form.category]}`}>
              <div className="text-[10px] font-mono opacity-60 mb-2">PREVIEW</div>
              <div className="flex items-center gap-3">
                <span className="text-xl">{form.icon || "🎯"}</span>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm">{form.name || "Milestone Name"}</div>
                  <div className="text-[10px] font-mono opacity-70">{form.description || "No description"}</div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-mono text-xs font-bold">{form.xpReward} XP</div>
                  <div className="text-[10px] font-mono opacity-60">
                    {form.category === "WEALTH" ? `₹${(parseFloat(form.threshold) || 0).toLocaleString("en-IN")}` : `${form.threshold || 0}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button className="hud-button" onClick={handleSave} disabled={createMilestone.isPending || updateMilestone.isPending}>
            <Target className="w-3.5 h-3.5 mr-1.5" />
            {editingId ? "UPDATE MILESTONE" : "CREATE MILESTONE"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={cancelEdit}>
              <X className="w-3.5 h-3.5 mr-1.5" /> CANCEL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [activeTab, setActiveTab] = useState<Tab>("OVERVIEW");

  if (meLoading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-primary">VERIFYING CLEARANCE...</div>;
  }

  if (!me?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <div className="text-destructive font-mono text-2xl hud-glow drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">ACCESS DENIED</div>
        <p className="text-muted-foreground font-mono">You lack the required clearance level for this terminal.</p>
        <Link href="/dashboard" className="hud-button h-10 px-6 py-2 mt-4">RETURN TO DASHBOARD</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-destructive/30 shrink-0">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-7 h-7 text-destructive animate-pulse" />
          <div>
            <h1 className="text-xl font-heading font-bold text-destructive tracking-widest drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">
              COMMAND CENTER
            </h1>
            <div className="text-[10px] font-mono text-destructive/60">OVERSIGHT TERMINAL // LEVEL 10 CLEARANCE // {me.displayName}</div>
          </div>
        </div>
        <Link href="/dashboard" className="inline-flex items-center text-xs font-heading border border-primary/30 px-4 py-2 hover:bg-primary/10 transition-colors text-primary">
          <ArrowLeft className="w-3.5 h-3.5 mr-2" /> EXIT
        </Link>
      </header>

      {/* Tab nav */}
      <nav className="flex border-b border-primary/20 px-6 shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[10px] font-mono font-bold tracking-widest whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "OVERVIEW" && <OverviewTab />}
        {activeTab === "PLAYERS" && <PlayersTab />}
        {activeTab === "QUEST DISPATCH" && <QuestDispatchTab />}
        {activeTab === "BADGES" && <BadgesTab />}
        {activeTab === "MILESTONES" && <MilestonesTab />}
      </main>
    </div>
  );
}
