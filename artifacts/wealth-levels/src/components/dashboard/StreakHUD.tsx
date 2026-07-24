/**
 * StreakHUD — compact streak + shield status widget for the dashboard header.
 * Shows: 🔥 N days | 🛡 N shields | milestone flash when user checks in.
 * Check-in is now triggered explicitly from StreakCard; this component only
 * reads state and reacts to the global "streak:checkin" custom event.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ShieldCheck, Trophy, Zap } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface CheckinResult {
  alreadyCheckedIn: boolean;
  streakDays: number;
  longestStreak: number;
  streakShields: number;
  shieldsUsedTotal: number;
  xpGained: number;
  shieldBurned: boolean;
  streakReset: boolean;
  milestone: { days: number; shields: number; label: string } | null;
}

interface Props {
  onCheckin?: (result: CheckinResult) => void;
}

const STREAK_COLORS = [
  { min: 0,   fg: "text-orange-400",       glow: "shadow-[0_0_8px_rgba(251,146,60,0.5)]"  },
  { min: 7,   fg: "text-orange-300",       glow: "shadow-[0_0_12px_rgba(253,186,116,0.6)]" },
  { min: 14,  fg: "text-yellow-300",       glow: "shadow-[0_0_14px_rgba(253,224,71,0.7)]"  },
  { min: 30,  fg: "text-yellow-200",       glow: "shadow-[0_0_18px_rgba(254,240,138,0.8)]" },
  { min: 100, fg: "text-amber-100",        glow: "shadow-[0_0_24px_rgba(255,251,235,0.9)]" },
];

function flameColor(days: number) {
  const tier = [...STREAK_COLORS].reverse().find(c => days >= c.min) ?? STREAK_COLORS[0];
  return tier;
}

export default function StreakHUD({ onCheckin }: Props) {
  const [data, setData] = useState<CheckinResult | null>(null);
  const [milestoneFlash, setMilestoneFlash] = useState<string | null>(null);
  const [xpFlash, setXpFlash] = useState<string | null>(null);
  const onCheckinRef = useRef(onCheckin);
  onCheckinRef.current = onCheckin;

  // Load streak state on mount (read-only — no auto check-in)
  useEffect(() => {
    fetch(`${BASE_URL}/api/streak`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        // Shape GET response to match CheckinResult so state type is consistent
        setData({
          alreadyCheckedIn: d.alreadyCheckedIn,
          streakDays: d.streakDays,
          longestStreak: d.longestStreak,
          streakShields: d.streakShields,
          shieldsUsedTotal: d.shieldsUsedTotal,
          xpGained: 0,
          shieldBurned: false,
          streakReset: false,
          milestone: null,
        });
      })
      .catch(() => {});
  }, []);

  // React to explicit check-ins fired from StreakCard
  useEffect(() => {
    function handleEvent(e: Event) {
      const result = (e as CustomEvent<CheckinResult>).detail;
      setData(result);
      onCheckinRef.current?.(result);

      if (!result.alreadyCheckedIn && result.xpGained > 0) {
        setXpFlash(`+${result.xpGained} XP`);
        setTimeout(() => setXpFlash(null), 2800);
      }

      if (result.milestone) {
        setMilestoneFlash(`${result.milestone.days}-DAY STREAK — ${result.milestone.label.toUpperCase()}`);
        setTimeout(() => setMilestoneFlash(null), 4500);
      }
    }

    window.addEventListener("streak:checkin", handleEvent);
    return () => window.removeEventListener("streak:checkin", handleEvent);
  }, []);

  if (!data) return null;

  const { streakDays, streakShields, longestStreak } = data;
  const fc = flameColor(streakDays);
  const shieldLow = streakShields === 1;
  const shieldEmpty = streakShields === 0;

  return (
    <div className="relative flex items-center gap-1">
      {/* Streak counter */}
      <div
        title={`Current streak: ${streakDays} days | Longest: ${longestStreak} days`}
        className={`flex items-center gap-1 px-2 py-1 border rounded-none
          ${streakDays >= 7
            ? "border-orange-400/50 bg-orange-400/10"
            : "border-primary/20 bg-primary/5"}
          cursor-default select-none`}
      >
        <Flame
          className={`w-3.5 h-3.5 shrink-0 ${fc.fg}`}
          style={{ filter: streakDays >= 7 ? "drop-shadow(0 0 6px rgba(251,146,60,0.8))" : undefined }}
        />
        <span className={`text-xs font-mono font-bold tracking-wider ${fc.fg}`}>
          {streakDays}
        </span>

        {/* XP pop */}
        <AnimatePresence>
          {xpFlash && (
            <motion.span
              key="xp"
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: -12, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-yellow-300 whitespace-nowrap pointer-events-none"
            >
              {xpFlash}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Shield counter */}
      <div
        title={`Streak Shields: ${streakShields} available. Shields auto-activate if you miss a day.`}
        className={`flex items-center gap-1 px-2 py-1 border rounded-none cursor-default select-none transition-colors
          ${shieldEmpty
            ? "border-red-500/40 bg-red-500/10"
            : shieldLow
            ? "border-yellow-400/40 bg-yellow-400/10"
            : "border-[#00c8ff]/30 bg-[#00c8ff]/5"}`}
      >
        <ShieldCheck
          className={`w-3.5 h-3.5 shrink-0 ${
            shieldEmpty ? "text-red-400" : shieldLow ? "text-yellow-300" : "text-[#00c8ff]"
          }`}
        />
        <span className={`text-xs font-mono font-bold tracking-wider ${
          shieldEmpty ? "text-red-400" : shieldLow ? "text-yellow-300" : "text-[#00c8ff]"
        }`}>
          {streakShields}
        </span>
      </div>

      {/* Milestone flash banner */}
      <AnimatePresence>
        {milestoneFlash && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="absolute top-8 right-0 z-50 flex items-center gap-2
              bg-[#080d1a] border border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.4)]
              px-3 py-2 whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span className="text-[10px] font-mono tracking-widest text-yellow-300 uppercase">
              {milestoneFlash}
            </span>
            <Zap className="w-3 h-3 text-yellow-300/60 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
