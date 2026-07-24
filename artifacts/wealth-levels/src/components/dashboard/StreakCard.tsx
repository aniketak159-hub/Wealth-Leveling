/**
 * StreakCard — detailed streak status panel for the Overview tab.
 * Shows: current streak, longest, shield count, milestone roadmap.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, ShieldCheck, Trophy, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface StreakState {
  streakDays: number;
  longestStreak: number;
  streakShields: number;
  shieldsUsedTotal: number;
  lastActivityDate: string | null;
  alreadyCheckedIn: boolean;
}

const MILESTONES = [
  { day: 3,   label: "Newcomer's Protection",  shields: 1 },
  { day: 7,   label: "One Week Standing",       shields: 1 },
  { day: 14,  label: "Fortnight Warrior",       shields: 1 },
  { day: 30,  label: "Monthly Veteran",         shields: 1 },
  { day: 60,  label: "Dedicated Player",        shields: 1 },
  { day: 100, label: "Century Club",            shields: 2 },
  { day: 365, label: "Annual Legend",           shields: 3 },
];

function flameGrad(days: number) {
  if (days >= 100) return "from-amber-200 to-yellow-400";
  if (days >= 30)  return "from-yellow-300 to-orange-400";
  if (days >= 14)  return "from-orange-300 to-orange-500";
  if (days >= 7)   return "from-orange-400 to-red-500";
  return "from-orange-500 to-red-600";
}

export default function StreakCard() {
  const [data, setData] = useState<StreakState | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/streak`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { streakDays, longestStreak, streakShields, shieldsUsedTotal } = data;
  const nextMilestone = MILESTONES.find(m => m.day > streakDays);
  const daysToNext = nextMilestone ? nextMilestone.day - streakDays : null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" /> DAILY STREAK
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Big streak counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={streakDays >= 3 ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-14 h-14 border-2 flex items-center justify-center
                ${streakDays >= 7
                  ? "border-orange-400/70 bg-orange-400/10 shadow-[0_0_16px_rgba(251,146,60,0.4)]"
                  : "border-primary/30 bg-primary/5"}`}
            >
              <div className="text-center">
                <div className={`text-xl font-heading font-bold leading-none
                  ${streakDays >= 7 ? "text-orange-300" : "text-primary"}`}>
                  {streakDays}
                </div>
                <div className="text-[8px] font-mono text-muted-foreground tracking-widest">DAYS</div>
              </div>
            </motion.div>

            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Current Streak</div>
              {daysToNext !== null && (
                <div className="text-[10px] font-mono text-[#00c8ff]/70 mt-0.5">
                  {daysToNext} day{daysToNext !== 1 ? "s" : ""} to next shield
                </div>
              )}
              {streakDays > 0 && (
                <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                  Best: {longestStreak} days
                </div>
              )}
            </div>
          </div>

          {/* Shield inventory */}
          <div className={`flex flex-col items-center gap-1 px-3 py-2 border
            ${streakShields === 0
              ? "border-red-500/40 bg-red-500/5"
              : streakShields === 1
              ? "border-yellow-400/40 bg-yellow-400/5"
              : "border-[#00c8ff]/30 bg-[#00c8ff]/5"}`}>
            <ShieldCheck className={`w-5 h-5 ${
              streakShields === 0 ? "text-red-400" :
              streakShields === 1 ? "text-yellow-300" :
              "text-[#00c8ff]"
            }`} />
            <div className={`text-lg font-heading font-bold leading-none ${
              streakShields === 0 ? "text-red-400" :
              streakShields === 1 ? "text-yellow-300" :
              "text-[#00c8ff]"
            }`}>{streakShields}</div>
            <div className="text-[8px] font-mono text-muted-foreground tracking-widest">SHIELDS</div>
          </div>
        </div>

        {/* Shield status message */}
        {streakShields === 0 && (
          <div className="px-3 py-2 border border-red-500/30 bg-red-500/5 text-[10px] font-mono text-red-400/80 tracking-wider">
            ⚠ No shields — a missed day will break your streak. Reach Day {nextMilestone?.day ?? 3} to earn one.
          </div>
        )}
        {streakShields === 1 && (
          <div className="px-3 py-2 border border-yellow-400/30 bg-yellow-400/5 text-[10px] font-mono text-yellow-300/80 tracking-wider">
            ⚡ 1 shield left — keep your streak to earn more at upcoming milestones.
          </div>
        )}

        {/* Milestone progress strip */}
        <div>
          <div className="text-[9px] font-mono text-muted-foreground/60 tracking-[0.25em] uppercase mb-2">
            Milestone Shields
          </div>
          <div className="space-y-1.5">
            {MILESTONES.map((m) => {
              const done = streakDays >= m.day;
              const next = m === nextMilestone;
              return (
                <div
                  key={m.day}
                  className={`flex items-center justify-between px-2 py-1.5 border
                    ${done
                      ? "border-[#00c8ff]/20 bg-[#00c8ff]/5"
                      : next
                      ? "border-yellow-400/30 bg-yellow-400/5"
                      : "border-primary/10 bg-transparent opacity-50"}`}
                >
                  <div className="flex items-center gap-2">
                    {done
                      ? <CheckCircle2 className="w-3 h-3 text-[#00c8ff] shrink-0" />
                      : next
                      ? <ShieldCheck className="w-3 h-3 text-yellow-300 shrink-0 animate-pulse" />
                      : <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    }
                    <span className={`text-[10px] font-mono tracking-wide ${
                      done ? "text-[#00c8ff]/80" : next ? "text-yellow-300/80" : "text-muted-foreground/50"
                    }`}>
                      Day {m.day} — {m.label}
                    </span>
                  </div>
                  <div className={`text-[9px] font-mono tracking-widest ${
                    done ? "text-[#00c8ff]/60" : next ? "text-yellow-300/60" : "text-muted-foreground/30"
                  }`}>
                    +{m.shields} 🛡
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lifetime stats */}
        {shieldsUsedTotal > 0 && (
          <div className="text-[9px] font-mono text-muted-foreground/40 tracking-wider pt-1 border-t border-primary/10">
            {shieldsUsedTotal} shield{shieldsUsedTotal !== 1 ? "s" : ""} used all-time — streaks protected.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
