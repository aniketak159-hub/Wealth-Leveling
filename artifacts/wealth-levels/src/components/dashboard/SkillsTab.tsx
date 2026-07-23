import { useState, useMemo } from "react";
import { useListSkills, useCheckinSkill } from "@workspace/api-client-react";
import { useSkillTree, useUnlockSkill } from "@/hooks/useSkillTree";
import {
  SKILL_TREES,
  TIER_NAMES,
  TIER_XP,
  CAPSTONE_BONUS_XP,
  UNLOCK_THRESHOLD,
  type SkillTree,
  type TreeSkill,
} from "@/data/skillTrees";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Activity,
  Lock,
  CheckCircle2,
  Zap,
  GitBranch,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Skill Tree View
// ─────────────────────────────────────────────────────────────────────────────

type SkillState = "unlocked" | "available" | "locked";

function getSkillState(
  skill: TreeSkill,
  unlockedSet: Set<string>,
  tierAccessible: boolean,
): SkillState {
  if (unlockedSet.has(skill.id)) return "unlocked";
  if (tierAccessible) return "available";
  return "locked";
}

interface SkillNodeProps {
  skill: TreeSkill;
  state: SkillState;
  skillPoints: number;
  isCapstone: boolean;
  xpReward: number;
  onUnlock: (id: string) => void;
  isPending: boolean;
}

function SkillNode({
  skill,
  state,
  skillPoints,
  isCapstone,
  xpReward,
  onUnlock,
  isPending,
}: SkillNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    state === "unlocked"
      ? "border-primary/60 bg-primary/5"
      : state === "available"
        ? "border-primary/25 bg-black/30 hover:border-primary/50"
        : "border-white/5 bg-black/10";

  const textColor =
    state === "unlocked"
      ? "text-primary"
      : state === "available"
        ? "text-foreground/80"
        : "text-foreground/25";

  return (
    <div
      className={`relative border px-3 py-2 transition-all cursor-pointer ${borderColor}`}
      onClick={() => state !== "locked" && setExpanded((e) => !e)}
    >
      <div className="flex items-start gap-2">
        {/* State icon */}
        <div className="mt-0.5 shrink-0">
          {state === "unlocked" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          ) : state === "available" ? (
            <div className="w-3.5 h-3.5 border border-primary/40 rounded-full" />
          ) : (
            <Lock className="w-3 h-3 text-foreground/20" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-mono leading-tight ${textColor} truncate`}>
            {skill.name}
            {isCapstone && (
              <span className="ml-1 text-yellow-400">★</span>
            )}
          </p>

          {/* XP badge */}
          <span className="text-[9px] font-mono text-foreground/30 mt-0.5 block">
            +{xpReward} XP{isCapstone ? ` +${CAPSTONE_BONUS_XP} BONUS` : ""}
          </span>
        </div>
      </div>

      {/* Expanded description + action */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[10px] font-mono text-foreground/50 leading-snug mb-2">
            {skill.description}
          </p>
          {state === "available" && (
            <Button
              size="sm"
              variant="outline"
              disabled={skillPoints < 1 || isPending}
              onClick={(e) => {
                e.stopPropagation();
                onUnlock(skill.id);
              }}
              className="h-6 text-[9px] px-2 border-primary/40 hover:border-primary hover:text-primary w-full"
            >
              {isPending ? "UNLOCKING..." : skillPoints < 1 ? "NO SKILL POINTS" : "UNLOCK — 1 SP"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface TierSectionProps {
  tree: SkillTree;
  tier: number;
  skills: TreeSkill[];
  unlockedSet: Set<string>;
  prevTierUnlockCount: number;
  skillPoints: number;
  onUnlock: (id: string) => void;
  pendingId: string | null;
}

function TierSection({
  tier,
  skills,
  unlockedSet,
  prevTierUnlockCount,
  skillPoints,
  onUnlock,
  pendingId,
}: TierSectionProps) {
  const tierAccessible = tier === 1 || prevTierUnlockCount >= UNLOCK_THRESHOLD;
  const unlockedInTier = skills.filter((s) => unlockedSet.has(s.id)).length;
  const xpReward = TIER_XP[tier] ?? 0;

  return (
    <div className={`${!tierAccessible ? "opacity-40" : ""}`}>
      {/* Tier header */}
      <div className="flex items-center justify-between px-1 py-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          {!tierAccessible && <Lock className="w-3 h-3 text-foreground/30" />}
          <span className="text-[10px] font-mono font-bold text-foreground/60 tracking-widest uppercase">
            T{tier}: {TIER_NAMES[tier]}
          </span>
        </div>
        <span className="text-[9px] font-mono text-foreground/40">
          {unlockedInTier}/10
        </span>
      </div>

      {!tierAccessible ? (
        <div className="text-[9px] font-mono text-foreground/30 px-1 pb-2">
          NEED {UNLOCK_THRESHOLD - prevTierUnlockCount} MORE IN T{tier - 1}
        </div>
      ) : (
        <div className="space-y-1">
          {skills.map((skill) => (
            <SkillNode
              key={skill.id}
              skill={skill}
              state={getSkillState(skill, unlockedSet, tierAccessible)}
              skillPoints={skillPoints}
              isCapstone={skill.id.endsWith("-10") && tier === 5}
              xpReward={xpReward}
              onUnlock={onUnlock}
              isPending={pendingId === skill.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TreeColumnProps {
  tree: SkillTree;
  unlockedSet: Set<string>;
  skillPoints: number;
  onUnlock: (id: string) => void;
  pendingId: string | null;
}

function TreeColumn({ tree, unlockedSet, skillPoints, onUnlock, pendingId }: TreeColumnProps) {
  const totalUnlocked = tree.skills.filter((s) => unlockedSet.has(s.id)).length;

  const skillsByTier = useMemo(() => {
    const map: Record<number, TreeSkill[]> = {};
    for (const skill of tree.skills) {
      if (!map[skill.tier]) map[skill.tier] = [];
      map[skill.tier].push(skill);
    }
    return map;
  }, [tree.skills]);

  const unlocksByTier = useMemo(() => {
    const map: Record<number, number> = {};
    for (let t = 1; t <= 5; t++) {
      map[t] = (skillsByTier[t] ?? []).filter((s) => unlockedSet.has(s.id)).length;
    }
    return map;
  }, [skillsByTier, unlockedSet]);

  const statColor =
    tree.key === "investment"
      ? "text-cyan-400"
      : tree.key === "savings"
        ? "text-emerald-400"
        : "text-violet-400";

  const headerBorder =
    tree.key === "investment"
      ? "border-cyan-400/30"
      : tree.key === "savings"
        ? "border-emerald-400/30"
        : "border-violet-400/30";

  return (
    <div className="flex flex-col min-w-0">
      {/* Tree header */}
      <div className={`border-b ${headerBorder} pb-3 mb-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-heading font-bold tracking-widest ${statColor}`}>
            {tree.label}
          </h3>
          <Badge variant="outline" className={`text-[9px] font-mono ${statColor} border-current`}>
            +{tree.statLink}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[9px] font-mono text-foreground/40 mb-1">
            <span>{totalUnlocked} / 50 UNLOCKED</span>
            <span>{Math.round((totalUnlocked / 50) * 100)}%</span>
          </div>
          <div className="h-1 bg-white/5 w-full">
            <div
              className={`h-full transition-all ${
                tree.key === "investment"
                  ? "bg-cyan-400/60"
                  : tree.key === "savings"
                    ? "bg-emerald-400/60"
                    : "bg-violet-400/60"
              }`}
              style={{ width: `${(totalUnlocked / 50) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="space-y-4 overflow-y-auto flex-1 pr-1" style={{ maxHeight: "calc(100vh - 320px)" }}>
        {[1, 2, 3, 4, 5].map((tier) => (
          <TierSection
            key={tier}
            tree={tree}
            tier={tier}
            skills={skillsByTier[tier] ?? []}
            unlockedSet={unlockedSet}
            prevTierUnlockCount={tier > 1 ? (unlocksByTier[tier - 1] ?? 0) : 0}
            skillPoints={skillPoints}
            onUnlock={onUnlock}
            pendingId={pendingId}
          />
        ))}
      </div>
    </div>
  );
}

function SkillTreeView() {
  const { data, isLoading, error } = useSkillTree();
  const unlockMutation = useUnlockSkill();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const unlockedSet = useMemo(
    () => new Set(data?.unlockedSkillIds ?? []),
    [data?.unlockedSkillIds],
  );

  async function handleUnlock(skillId: string) {
    setErrorMsg(null);
    setPendingId(skillId);
    try {
      await unlockMutation.mutateAsync(skillId);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to unlock skill.");
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-primary font-mono text-sm hud-cursor">
        LOADING SKILL MATRIX...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive font-mono text-sm p-4">
        ERROR LOADING SKILL TREE: {(error as Error).message}
      </div>
    );
  }

  const skillPoints = data?.skillPoints ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Skill point counter */}
      <div className="flex items-center justify-between border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-mono text-sm text-foreground/80">
            SKILL POINTS AVAILABLE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-2xl text-yellow-400">{skillPoints}</span>
          <span className="font-mono text-xs text-foreground/40">SP</span>
        </div>
      </div>

      {skillPoints === 0 && (
        <p className="text-[11px] font-mono text-foreground/40 text-center">
          Complete a monthly evaluation to earn Skill Points
        </p>
      )}

      {errorMsg && (
        <div className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Click a skill to expand / unlock */}
      <p className="text-[10px] font-mono text-foreground/30 text-center -mt-2">
        TAP A SKILL TO VIEW DETAILS · TIER 1 ALWAYS ACCESSIBLE · UNLOCK 6/10 TO ADVANCE
      </p>

      {/* Three tree columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SKILL_TREES.map((tree) => (
          <TreeColumn
            key={tree.key}
            tree={tree}
            unlockedSet={unlockedSet}
            skillPoints={skillPoints}
            onUnlock={handleUnlock}
            pendingId={pendingId}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Habits View (existing custom skills)
// ─────────────────────────────────────────────────────────────────────────────

function MyHabitsView() {
  const { data: skills, isLoading } = useListSkills();
  const checkinMutation = useCheckinSkill();

  const investmentSkills = skills?.filter((s) => s.category === "INVESTMENT") ?? [];
  const savingsSkills = skills?.filter((s) => s.category === "SAVINGS") ?? [];
  const knowledgeSkills = skills?.filter((s) => s.category === "KNOWLEDGE") ?? [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-primary font-mono hud-cursor">
        LOADING HABITS...
      </div>
    );
  }

  const HabitGroup = ({
    title,
    data,
    color,
  }: {
    title: string;
    data: typeof skills;
    color: string;
  }) => (
    <div className="flex flex-col gap-2">
      <h3 className={`text-xs font-mono font-bold tracking-widest mb-1 ${color}`}>{title}</h3>
      {data && data.length > 0 ? (
        data.map((skill) => (
          <div
            key={skill.id}
            className="border border-primary/10 px-3 py-2 bg-black/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-16 h-16 text-primary -top-2 -right-2 absolute" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <h4 className="font-heading font-bold text-primary text-sm">{skill.name}</h4>
                <Badge variant="outline" className="bg-primary/5 text-[10px]">
                  LVL {skill.level}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-2">
                <span className="text-yellow-400">{skill.streakCount}D STREAK</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={checkinMutation.isPending}
                  onClick={() => checkinMutation.mutate({ id: String(skill.id) })}
                  className="h-6 text-[10px] px-2 py-0 border-primary/30 hover:border-primary"
                >
                  LOG CHECK-IN
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-4 text-muted-foreground text-xs font-mono border border-dashed border-primary/20">
          NO HABITS YET
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-mono text-foreground/40">
        Custom habits you track with daily check-ins and streaks.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HabitGroup title="INVESTMENT" data={investmentSkills} color="text-cyan-400" />
        <HabitGroup title="SAVINGS" data={savingsSkills} color="text-emerald-400" />
        <HabitGroup title="KNOWLEDGE" data={knowledgeSkills} color="text-violet-400" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SkillsTab
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = "tree" | "habits";

export default function SkillsTab() {
  const [activeTab, setActiveTab] = useState<TabKey>("tree");

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> SKILL MATRIX
          </h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            Unlock knowledge nodes · Build financial power permanently
          </p>
        </div>
        {activeTab === "habits" && (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> ADD HABIT
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-primary/20">
        <button
          onClick={() => setActiveTab("tree")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-widest border-b-2 transition-colors ${
            activeTab === "tree"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/40 hover:text-foreground/70"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          SKILL TREE
        </button>
        <button
          onClick={() => setActiveTab("habits")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-widest border-b-2 transition-colors ${
            activeTab === "habits"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/40 hover:text-foreground/70"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          MY HABITS
        </button>
      </div>

      {/* Content */}
      {activeTab === "tree" ? <SkillTreeView /> : <MyHabitsView />}
    </div>
  );
}
