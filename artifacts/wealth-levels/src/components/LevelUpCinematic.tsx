import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X } from "lucide-react";

interface Props {
  newLevel: number;
  newRank: string;
  prevRank: string;
  newXp: number;
  xpToNext: number;
  xpGained: number;
  displayName: string;
  onClose: () => void;
}

const RANK_CONFIG: Record<string, { color: string; glow: string; title: string }> = {
  S: { color: "#facc15", glow: "250,204,21",  title: "SOVEREIGN WEALTH MASTER" },
  A: { color: "#c084fc", glow: "192,132,252", title: "ELITE FINANCIAL COMMANDER" },
  B: { color: "#60a5fa", glow: "96,165,250",  title: "WEALTH ARCHITECT" },
  C: { color: "#4ade80", glow: "74,222,128",  title: "SEASONED WEALTH HUNTER" },
  D: { color: "#fb923c", glow: "251,146,60",  title: "APPRENTICE WEALTH HUNTER" },
  E: { color: "#9ca3af", glow: "156,163,175", title: "NOVICE WEALTH HUNTER" },
};

export default function LevelUpCinematic({
  newLevel,
  newRank,
  prevRank,
  newXp,
  xpToNext,
  xpGained,
  displayName,
  onClose,
}: Props) {
  const cfg = RANK_CONFIG[newRank] ?? RANK_CONFIG.E;
  const rankPromoted = newRank !== prevRank;
  const [xpCount, setXpCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Deterministic particle field — never re-randomised on re-render
  const particles = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      angle: (i / 36) * 360 + (i % 3) * 4,
      dist: 120 + (i % 4) * 50,
      delay: 0.9 + i * 0.02,
      size: [3, 4, 4, 6][i % 4],
    })), []);

  // Animated XP counter (starts at 1.4 s to sync with reveal)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const dur = 1400;
      const tick = () => {
        const t = Math.min((Date.now() - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setXpCount(Math.round(ease * xpGained));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 1400);
    return () => clearTimeout(timeout);
  }, [xpGained]);

  async function handleShare() {
    const rankTitle = cfg.title;
    const text =
      `⚡ WEALTH LEVELING\n\n` +
      `HUNTER: ${displayName.toUpperCase()}\n` +
      `${newRank}-RANK · LEVEL ${newLevel}\n` +
      `${rankTitle}\n\n` +
      `+${xpGained.toLocaleString()} XP EARNED THIS MONTH\n\n` +
      `Track your financial power level → wealthleveling.replit.app`;

    if (typeof navigator.share === "function") {
      await navigator.share({ title: "Wealth Leveling — Level Up", text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  const xpPct = Math.min(100, (newXp / xpToNext) * 100);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: "#000" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* ── scanlines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)",
          zIndex: 1,
        }}
      />

      {/* ── ambient radial glow ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 55% at 50% 50%, rgba(${cfg.glow},0.18) 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── scan beam ── */}
      <motion.div
        className="absolute inset-x-0 h-px pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${cfg.glow},0.8) 50%, transparent 100%)`,
          zIndex: 2,
        }}
        initial={{ top: "-1px" }}
        animate={{ top: "100%" }}
        transition={{ duration: 0.75, ease: "linear", delay: 0.08 }}
      />

      {/* ── corner brackets ── */}
      {[
        "top-0 left-0 border-t-2 border-l-2",
        "top-0 right-0 border-t-2 border-r-2",
        "bottom-0 left-0 border-b-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
      ].map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute w-8 h-8 ${cls}`}
          style={{ borderColor: `rgba(${cfg.glow},0.5)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.3 }}
        />
      ))}

      {/* ── particles ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: cfg.color,
              boxShadow: `0 0 ${p.size * 2}px ${cfg.color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
              y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* ── main card ── */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-8 max-w-xs w-full">

        {/* system alert label */}
        <motion.p
          className="text-[10px] font-mono tracking-[0.35em] text-center"
          style={{ color: cfg.color }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.35 }}
        >
          ◈ HUNTER STATUS UPDATED ◈
        </motion.p>

        {/* rank diamond badge */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.0, type: "spring", stiffness: 220, damping: 14 }}
        >
          {/* pulsing outer rings */}
          {[140, 116].map((sz, i) => (
            <motion.div
              key={sz}
              className="absolute rounded-full border"
              style={{ width: sz, height: sz, borderColor: `rgba(${cfg.glow},0.4)` }}
              animate={{ scale: [1, 1.12 - i * 0.04, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 1.6 + i * 0.2, ease: "easeInOut" }}
            />
          ))}
          {/* diamond body */}
          <div
            className="w-[88px] h-[88px] rotate-45 flex items-center justify-center border-2"
            style={{
              borderColor: cfg.color,
              background: `rgba(${cfg.glow},0.12)`,
              boxShadow: `0 0 32px rgba(${cfg.glow},0.35), inset 0 0 20px rgba(${cfg.glow},0.1)`,
            }}
          >
            <span
              className="font-heading font-black text-4xl -rotate-45"
              style={{ color: cfg.color, textShadow: `0 0 20px rgba(${cfg.glow},0.9), 0 0 40px rgba(${cfg.glow},0.5)` }}
            >
              {newRank}
            </span>
          </div>
        </motion.div>

        {/* level number */}
        <motion.div
          className="text-center -mt-1"
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 280, damping: 18 }}
        >
          <p
            className="font-heading font-black text-[3.5rem] leading-none"
            style={{ color: "#fff", textShadow: `0 0 24px rgba(${cfg.glow},0.6)` }}
          >
            LEVEL {newLevel}
          </p>
          {rankPromoted && (
            <motion.p
              className="text-[10px] font-mono tracking-widest mt-2"
              style={{ color: cfg.color }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.55, duration: 0.3 }}
            >
              RANK PROMOTION: {prevRank} → {newRank}
            </motion.p>
          )}
        </motion.div>

        {/* title */}
        <motion.p
          className="text-[9px] font-mono tracking-[0.2em] text-white/50 text-center -mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.4 }}
        >
          {cfg.title}
        </motion.p>

        {/* hunter name */}
        <motion.div
          className="text-center -mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
        >
          <p className="text-[9px] font-mono text-white/30 tracking-[0.25em] mb-0.5">HUNTER</p>
          <p className="font-heading font-bold text-base text-white tracking-widest">{displayName.toUpperCase()}</p>
        </motion.div>

        {/* XP gained */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.35 }}
        >
          <p
            className="font-heading font-bold text-3xl"
            style={{ color: cfg.color, textShadow: `0 0 16px rgba(${cfg.glow},0.6)` }}
          >
            +{xpCount.toLocaleString()} XP
          </p>
          <p className="text-[9px] font-mono text-white/30 tracking-widest mt-0.5">EARNED THIS MONTH</p>
        </motion.div>

        {/* XP bar */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.75 }}
        >
          <div className="flex justify-between text-[9px] font-mono text-white/25 mb-1.5">
            <span>{newXp.toLocaleString()} XP</span>
            <span>NEXT LV: {xpToNext.toLocaleString()}</span>
          </div>
          <div className="h-1 w-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full"
              style={{ background: `linear-gradient(90deg, rgba(${cfg.glow},0.6), ${cfg.color})` }}
              initial={{ width: "0%" }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 2.0, duration: 1.1, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* action buttons */}
        <motion.div
          className="w-full flex gap-3 pt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0, duration: 0.4 }}
        >
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border font-mono text-[10px] tracking-widest transition-all hover:brightness-125 active:scale-95"
            style={{ borderColor: `rgba(${cfg.glow},0.5)`, color: cfg.color, background: `rgba(${cfg.glow},0.07)` }}
          >
            <Share2 className="w-3 h-3" />
            {copied ? "COPIED!" : "SHARE"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 font-mono text-[10px] tracking-widest border border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-all active:scale-95"
          >
            CONTINUE
          </button>
        </motion.div>
      </div>

      {/* close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/20 hover:text-white/50 z-20 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>

      {/* watermark — makes the screenshot self-identify */}
      <motion.p
        className="absolute bottom-5 text-[8px] font-mono tracking-[0.3em] text-white/15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
      >
        WEALTH LEVELING · POWER LEVEL SYSTEM
      </motion.p>
    </motion.div>
  );
}
