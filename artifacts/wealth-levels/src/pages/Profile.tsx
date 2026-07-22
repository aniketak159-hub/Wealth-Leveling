import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  useGetMe,
  useUpdateMe,
  useGetDashboard,
  useListQuests,
  useListSkills,
  useListBuilds,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  Phone,
  Shield,
  Trophy,
  User,
  X,
  Zap,
  Star,
  Calendar,
  Hash,
  TrendingUp,
  Target,
  Flame,
  BookOpen,
  Cpu,
  Award,
  Crown,
  Gem,
  Swords,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Achievement System ──────────────────────────────────────────────────────

type Rarity = "common" | "uncommon" | "rare" | "legendary";

interface Achievement {
  id: string;
  label: string;
  description: string;
  Icon: React.ElementType;
  earned: boolean;
  rarity: Rarity;
  earnedAt?: string;
}

const rarityStyle: Record<Rarity, string> = {
  common: "border-gray-500/40 bg-gray-500/10 text-gray-400",
  uncommon: "border-green-500/40 bg-green-500/10 text-green-400",
  rare: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  legendary: "border-yellow-400/40 bg-yellow-400/10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]",
};

const rarityLabel: Record<Rarity, string> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  legendary: "LEGENDARY",
};

function buildAchievements(params: {
  level: number;
  rank: string;
  netWorth: number;
  completedQuests: number;
  totalQuests: number;
  maxSkillStreak: number;
  totalSkills: number;
  hasKnowledgeSkill: boolean;
  hasInvestmentSkill: boolean;
  totalBuilds: number;
  daysActive: number;
  statPoints: number;
}): Achievement[] {
  const {
    level, rank, netWorth, completedQuests, totalQuests,
    maxSkillStreak, totalSkills, hasKnowledgeSkill,
    hasInvestmentSkill, totalBuilds, daysActive, statPoints,
  } = params;

  return [
    {
      id: "system_online",
      label: "System Online",
      description: "Initialized your Hunter account",
      Icon: Zap,
      earned: true,
      rarity: "common",
    },
    {
      id: "week_one",
      label: "Week One",
      description: "Active for 7+ days",
      Icon: Calendar,
      earned: daysActive >= 7,
      rarity: "common",
    },
    {
      id: "month_one",
      label: "Seasoned Hunter",
      description: "Active for 30+ days",
      Icon: Calendar,
      earned: daysActive >= 30,
      rarity: "uncommon",
    },
    {
      id: "first_quest",
      label: "First Mission",
      description: "Completed your first quest",
      Icon: Target,
      earned: completedQuests >= 1,
      rarity: "common",
    },
    {
      id: "quest_veteran",
      label: "Quest Veteran",
      description: "Completed 10 quests",
      Icon: Trophy,
      earned: completedQuests >= 10,
      rarity: "uncommon",
    },
    {
      id: "quest_legend",
      label: "Quest Legend",
      description: "Completed 25 quests",
      Icon: Crown,
      earned: completedQuests >= 25,
      rarity: "rare",
    },
    {
      id: "skill_initiate",
      label: "Skill Initiate",
      description: "Learned your first skill",
      Icon: BookOpen,
      earned: totalSkills >= 1,
      rarity: "common",
    },
    {
      id: "streak_warrior",
      label: "Streak Warrior",
      description: "Maintained a 7-day skill streak",
      Icon: Flame,
      earned: maxSkillStreak >= 7,
      rarity: "uncommon",
    },
    {
      id: "knowledge_seeker",
      label: "Knowledge Seeker",
      description: "Mastered a Knowledge skill",
      Icon: BookOpen,
      earned: hasKnowledgeSkill,
      rarity: "uncommon",
    },
    {
      id: "investor",
      label: "The Investor",
      description: "Mastered an Investment skill",
      Icon: TrendingUp,
      earned: hasInvestmentSkill,
      rarity: "uncommon",
    },
    {
      id: "guild_founder",
      label: "Guild Founder",
      description: "Registered your first Build",
      Icon: Swords,
      earned: totalBuilds >= 1,
      rarity: "common",
    },
    {
      id: "guild_master",
      label: "Guild Master",
      description: "Running 3+ active Builds",
      Icon: Swords,
      earned: totalBuilds >= 3,
      rarity: "rare",
    },
    {
      id: "stat_allocator",
      label: "Stat Allocator",
      description: "Spent your first stat points",
      Icon: Cpu,
      earned: statPoints > 0,
      rarity: "common",
    },
    {
      id: "rank_up",
      label: "Rank Ascending",
      description: "Reached Level 5",
      Icon: Star,
      earned: level >= 5,
      rarity: "uncommon",
    },
    {
      id: "elite_hunter",
      label: "Elite Hunter",
      description: "Reached Level 10",
      Icon: Award,
      earned: level >= 10,
      rarity: "rare",
    },
    {
      id: "net_worth_100k",
      label: "First 100K",
      description: "Net worth crossed ₹1,00,000",
      Icon: TrendingUp,
      earned: netWorth >= 100_000,
      rarity: "uncommon",
    },
    {
      id: "net_worth_1m",
      label: "Millionaire Hunter",
      description: "Net worth crossed ₹10,00,000",
      Icon: Gem,
      earned: netWorth >= 1_000_000,
      rarity: "rare",
    },
    {
      id: "s_rank",
      label: "S-Rank Titan",
      description: "Achieved the legendary S rank",
      Icon: Crown,
      earned: rank === "S",
      rarity: "legendary",
    },
  ];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono tracking-[0.3em] text-primary/50 uppercase mb-3 flex items-center gap-2">
      <div className="h-px flex-1 bg-primary/20" />
      {children}
      <div className="h-px flex-1 bg-primary/20" />
    </div>
  );
}

function FieldRow({
  label,
  value,
  icon: Icon,
  action,
  actionLabel,
  onAction,
  muted,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  action?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-primary/10 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-primary/50 shrink-0" />
        <div className="min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{label}</div>
          <div className={`text-sm font-mono truncate ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</div>
        </div>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="shrink-0 text-[10px] font-mono tracking-wider text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
        >
          {actionLabel ?? "EDIT"} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Avatar Upload ───────────────────────────────────────────────────────────

function AvatarUpload({
  imageUrl,
  displayName,
  onUpload,
  uploading,
}: {
  imageUrl: string | null;
  displayName: string;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div className="w-24 h-24 border-2 border-primary bg-primary/10 hud-glow-box overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-heading font-bold text-primary">{initials}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary text-background flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      <div className="text-[10px] font-mono text-muted-foreground tracking-wider text-center">
        CLICK ICON TO UPLOAD
      </div>
    </div>
  );
}

// ─── Password Change ─────────────────────────────────────────────────────────

function PasswordCard({ passwordEnabled }: { passwordEnabled: boolean }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setError(""); setSuccess(false); setOpen(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError("");
    if (newPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await user.updatePassword({
        newPassword: newPw,
        currentPassword: passwordEnabled ? currentPw : undefined,
        signOutOfOtherSessions: true,
      });
      setSuccess(true);
      setTimeout(reset, 2000);
    } catch (e: any) {
      setError(e?.errors?.[0]?.longMessage ?? e?.message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hud-panel p-4">
      <SectionLabel>Security</SectionLabel>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between py-2 text-sm font-mono text-foreground hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary/50" />
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Password</div>
              <div className="text-sm">••••••••••••</div>
            </div>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-primary/60 hover:text-primary flex items-center gap-1">
            CHANGE <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          {success ? (
            <div className="flex items-center gap-2 text-success text-sm font-mono py-2">
              <Check className="w-4 h-4" /> PASSWORD UPDATED SUCCESSFULLY
            </div>
          ) : (
            <>
              {passwordEnabled && (
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="New password (min. 8 chars)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="font-mono text-sm"
              />
              {error && <div className="text-destructive text-xs font-mono">{error}</div>}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  size="sm"
                  className="hud-button flex-1 h-8 text-xs"
                >
                  {loading ? "UPDATING..." : "CONFIRM CHANGE"}
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-primary/30"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Display Name Editor ─────────────────────────────────────────────────────

function DisplayNameEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setError("Name cannot be empty."); return; }
    setLoading(true);
    try {
      await onSave(trimmed);
      setEditing(false);
      setError("");
    } catch {
      setError("Failed to update name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-primary/10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <User className="w-4 h-4 text-primary/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Display Name</div>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-7 text-sm font-mono py-0 px-2"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              />
              <button onClick={handleSave} disabled={loading} className="text-success hover:text-success/80 disabled:opacity-50">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditing(false); setValue(initial); setError(""); }} className="text-destructive hover:text-destructive/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-sm font-mono truncate">{initial}</div>
          )}
          {error && <div className="text-destructive text-xs font-mono mt-1">{error}</div>}
        </div>
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-[10px] font-mono tracking-wider text-primary/60 hover:text-primary flex items-center gap-1 transition-colors"
        >
          EDIT <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Achievement Badge ───────────────────────────────────────────────────────

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const { Icon, earned, rarity, label, description } = achievement;
  return (
    <div
      className={`relative flex flex-col items-center gap-2 p-3 border transition-all ${
        earned
          ? rarityStyle[rarity]
          : "border-white/5 bg-white/2 text-white/15"
      }`}
      title={description}
    >
      {earned && (
        <div className={`absolute top-1 right-1 text-[8px] font-mono tracking-wider ${rarityStyle[rarity].split(" ").find(c => c.startsWith("text-")) ?? ""}`}>
          {rarityLabel[rarity]}
        </div>
      )}
      <Icon className={`w-6 h-6 ${earned ? "" : "opacity-15"}`} />
      <div className={`text-[9px] font-mono tracking-wider text-center leading-tight ${earned ? "" : "opacity-15"}`}>
        {label}
      </div>
      {!earned && (
        <Lock className="absolute top-1 right-1 w-2.5 h-2.5 opacity-20" />
      )}
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe();
  const { mutateAsync: updateMe } = useUpdateMe();
  const { data: dashboard } = useGetDashboard();
  const { data: quests } = useListQuests();
  const { data: skills } = useListSkills();
  const { data: builds } = useListBuilds();

  const [avatarUploading, setAvatarUploading] = useState(false);

  // Account metadata
  const joinedAt = me?.createdAt ? new Date(me.createdAt) : null;
  const daysActive = joinedAt
    ? Math.floor((Date.now() - joinedAt.getTime()) / 86_400_000)
    : 0;

  // Clerk user data
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const phone = user?.primaryPhoneNumber?.phoneNumber ?? "Not set";
  const passwordEnabled = !!user?.passwordEnabled;
  const imageUrl = user?.imageUrl ?? me?.avatarUrl ?? null;
  const displayName = me?.displayName ?? user?.fullName ?? "Hunter";

  // Dashboard stats
  const level = dashboard?.level ?? 1;
  const xp = dashboard?.xp ?? 0;
  const xpToNext = dashboard?.xpToNext ?? 100;
  const rank = dashboard?.rank ?? "E";
  const netWorth = dashboard?.netWorth ?? 0;
  const stats = dashboard?.stats;
  const totalStatPoints = stats
    ? (stats.str + stats.vit + stats.int + stats.agi + stats.per + stats.luk)
    : 0;

  // Achievement inputs
  const completedQuests = quests?.filter((q) => q.completed).length ?? 0;
  const totalQuests = quests?.length ?? 0;
  const maxSkillStreak = skills?.reduce((max, s) => Math.max(max, s.streakCount), 0) ?? 0;
  const hasKnowledgeSkill = skills?.some((s) => s.category === "KNOWLEDGE") ?? false;
  const hasInvestmentSkill = skills?.some((s) => s.category === "INVESTMENT") ?? false;

  const achievements = buildAchievements({
    level, rank, netWorth,
    completedQuests, totalQuests,
    maxSkillStreak,
    totalSkills: skills?.length ?? 0,
    hasKnowledgeSkill, hasInvestmentSkill,
    totalBuilds: builds?.length ?? 0,
    daysActive,
    statPoints: totalStatPoints,
  });

  const earnedCount = achievements.filter((a) => a.earned).length;

  // Rank styling
  const rankColorMap: Record<string, string> = {
    S: "rank-s", A: "rank-a", B: "rank-b", C: "rank-c", D: "rank-d", E: "rank-e",
  };
  const rankClass = rankColorMap[rank] ?? "rank-e";
  const xpPercent = xpToNext > 0 ? Math.min(100, (xp / xpToNext) * 100) : 0;

  // Handlers
  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    try {
      await user.setProfileImage({ file });
      const newUrl = user.imageUrl;
      if (newUrl) {
        await updateMe({ data: { avatarUrl: newUrl } });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      }
    } catch (e) {
      console.error("Avatar upload failed", e);
    } finally {
      setAvatarUploading(false);
    }
  }, [user, updateMe, queryClient]);

  const handleNameSave = useCallback(async (name: string) => {
    await updateMe({ data: { displayName: name } });
    queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
  }, [updateMe, queryClient]);

  if (!clerkLoaded || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-mono hud-cursor">LOADING PROFILE DATA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-black/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-primary/60 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-xs font-mono tracking-[0.3em] text-muted-foreground">HUNTER PROFILE</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs font-heading ${rankClass}`}>{rank}-RANK</Badge>
          <span className="text-xs font-mono text-primary">LVL {level}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hud-panel p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          <AvatarUpload
            imageUrl={imageUrl}
            displayName={displayName}
            onUpload={handleAvatarUpload}
            uploading={avatarUploading}
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-[10px] font-mono tracking-[0.3em] text-primary/50 mb-1">HUNTER DESIGNATION</div>
            <h1 className="text-3xl font-heading font-bold text-primary hud-glow tracking-wider mb-1">{displayName}</h1>
            <div className="text-sm font-mono text-muted-foreground mb-4">{dashboard?.title ?? "Novice Wealth Hunter"}</div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-primary">{level}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider">LEVEL</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-heading font-bold ${rankClass.split(" ").find(c => c.startsWith("text-")) ?? "text-primary"}`}>{rank}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider">RANK</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-primary">{daysActive}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider">DAYS ACTIVE</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-heading font-bold text-primary">{earnedCount}/{achievements.length}</div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-wider">BADGES</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Identity */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="hud-panel p-4"
            >
              <SectionLabel>Identity</SectionLabel>
              <DisplayNameEditor initial={displayName} onSave={handleNameSave} />
              <FieldRow label="Email Address" value={email} icon={Mail} muted={email === "—"} />
              <FieldRow label="Phone Number" value={phone} icon={Phone} muted={phone === "Not set"} />
              <div className="pt-2 text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                Email and phone are managed by your Clerk account.
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <PasswordCard passwordEnabled={passwordEnabled} />
            </motion.div>

            {/* Account info */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="hud-panel p-4"
            >
              <SectionLabel>Account Info</SectionLabel>
              <FieldRow
                label="Member Since"
                value={joinedAt ? joinedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                icon={Calendar}
              />
              <FieldRow
                label="Days Active"
                value={`${daysActive} day${daysActive !== 1 ? "s" : ""}`}
                icon={Flame}
              />
              <FieldRow
                label="Hunter ID"
                value={`#${String(me.id).padStart(6, "0")}`}
                icon={Hash}
              />
              <FieldRow
                label="Admin Access"
                value={me.isAdmin ? "GRANTED" : "STANDARD"}
                icon={Shield}
              />
            </motion.div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Character snapshot */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="hud-panel p-4"
            >
              <SectionLabel>Character Snapshot</SectionLabel>
              <div className="space-y-3">
                {/* XP Bar */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-primary">LVL {level}</span>
                    <span className="text-primary/60">{xp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
                  </div>
                  <Progress value={xpPercent} className="h-2" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { key: "Net Worth", val: `₹${netWorth.toLocaleString("en-IN")}`, col: "text-primary" },
                    { key: "Quests Done", val: `${completedQuests}/${totalQuests}`, col: "text-success" },
                    { key: "Builds", val: `${builds?.length ?? 0}`, col: "text-info" },
                  ].map((s) => (
                    <div key={s.key} className="bg-primary/5 border border-primary/10 p-2 text-center">
                      <div className={`text-base font-heading font-bold ${s.col}`}>{s.val}</div>
                      <div className="text-[9px] font-mono text-muted-foreground tracking-wider">{s.key}</div>
                    </div>
                  ))}
                </div>

                {/* Stat allocation */}
                {stats && (
                  <div className="pt-1">
                    <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">STAT ALLOCATION</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: "STR", val: stats.str, desc: "Growth" },
                        { key: "VIT", val: stats.vit, desc: "Stability" },
                        { key: "INT", val: stats.int, desc: "Diversify" },
                        { key: "AGI", val: stats.agi, desc: "Savings" },
                        { key: "PER", val: stats.per, desc: "Budget" },
                        { key: "LUK", val: stats.luk, desc: "Emergency" },
                      ].map((s) => (
                        <div key={s.key} className="flex items-center gap-1.5">
                          <div className="text-[10px] font-heading text-primary/70 w-6 shrink-0">{s.key}</div>
                          <div className="flex-1 bg-primary/10 h-1">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(100, s.val * 5)}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-mono text-primary w-4 text-right">{s.val}</div>
                        </div>
                      ))}
                    </div>
                    {(stats.unspentPoints ?? 0) > 0 && (
                      <div className="mt-2 text-[10px] font-mono text-warning">
                        {stats.unspentPoints} UNSPENT POINT{stats.unspentPoints !== 1 ? "S" : ""} — ALLOCATE IN STATS TAB
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="hud-panel p-4"
            >
              <SectionLabel>Achievements & Badges</SectionLabel>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-muted-foreground">
                  <span className="text-primary font-bold">{earnedCount}</span> of {achievements.length} unlocked
                </div>
                <div className="w-32">
                  <Progress value={(earnedCount / achievements.length) * 100} className="h-1.5" />
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {achievements.map((a) => (
                  <AchievementBadge key={a.id} achievement={a} />
                ))}
              </div>

              {/* Rarity legend */}
              <div className="mt-4 pt-3 border-t border-primary/10 flex flex-wrap gap-3">
                {(["common", "uncommon", "rare", "legendary"] as Rarity[]).map((r) => (
                  <div key={r} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 border ${rarityStyle[r].split(" ").find(c => c.startsWith("border-")) ?? ""} ${rarityStyle[r].split(" ").find(c => c.startsWith("bg-")) ?? ""}`} />
                    <span className="text-[9px] font-mono text-muted-foreground tracking-wider">{rarityLabel[r]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
