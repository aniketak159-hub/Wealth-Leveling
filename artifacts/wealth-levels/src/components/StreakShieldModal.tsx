/**
 * StreakShieldModal
 * Full-screen dramatic overlay shown when a Streak Shield auto-activates.
 * The player must *feel* their streak was saved — not just see a small toast.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Flame, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  streakDays: number;
  shieldsLeft: number;
  onClose: () => void;
}

export default function StreakShieldModal({ open, streakDays, shieldsLeft, onClose }: Props) {
  const [phase, setPhase] = useState<"shield" | "confirm">("shield");

  useEffect(() => {
    if (open) {
      setPhase("shield");
      const t = setTimeout(() => setPhase("confirm"), 1800);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="shield-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-sm"
        >
          {/* Phase 1: dramatic shield activation */}
          <AnimatePresence mode="wait">
            {phase === "shield" && (
              <motion.div
                key="shield-phase"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Pulsing shield glyph */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#00c8ff]/20 blur-2xl"
                  />
                  <div className="relative w-32 h-32 border-4 border-[#00c8ff]/80 bg-[#00c8ff]/10
                    shadow-[0_0_60px_rgba(0,200,255,0.6),inset_0_0_30px_rgba(0,200,255,0.2)]
                    flex items-center justify-center">
                    <ShieldCheck className="w-16 h-16 text-[#00c8ff]" style={{ filter: "drop-shadow(0 0 16px rgba(0,200,255,0.9))" }} />
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="text-[10px] font-mono tracking-[0.4em] text-[#00c8ff]/60 uppercase mb-2">
                    STREAK SHIELD // ACTIVATED
                  </div>
                  <div className="text-2xl font-heading tracking-widest text-[#00c8ff] uppercase"
                    style={{ textShadow: "0 0 20px rgba(0,200,255,0.8)" }}>
                    Streak Protected
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Phase 2: details + continue */}
            {phase === "confirm" && (
              <motion.div
                key="confirm-phase"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-sm mx-4 bg-[#080d1a] border border-[#00c8ff]/50
                  shadow-[0_0_40px_rgba(0,200,255,0.2)] p-8 text-center"
              >
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00c8ff]/70" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00c8ff]/70" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00c8ff]/70" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00c8ff]/70" />

                {/* Icons */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <ShieldCheck className="w-8 h-8 text-[#00c8ff]" style={{ filter: "drop-shadow(0 0 10px rgba(0,200,255,0.7))" }} />
                  <ChevronRight className="w-4 h-4 text-[#00c8ff]/40" />
                  <Flame className="w-8 h-8 text-orange-400" style={{ filter: "drop-shadow(0 0 10px rgba(251,146,60,0.7))" }} />
                </div>

                <div className="text-[10px] font-mono tracking-[0.35em] text-[#00c8ff]/50 uppercase mb-2">
                  STREAK PROTECTED
                </div>
                <div className="font-heading text-xl tracking-widest text-[#00c8ff] uppercase mb-1">
                  {streakDays}-Day Streak
                </div>
                <div className="font-heading text-xl tracking-widest text-[#00c8ff] uppercase mb-5">
                  Still Alive
                </div>

                <p className="text-xs font-mono text-[#66a3cc] leading-relaxed mb-6">
                  A Streak Shield was automatically consumed to protect your streak.
                  {shieldsLeft > 0
                    ? ` You have ${shieldsLeft} shield${shieldsLeft > 1 ? "s" : ""} remaining.`
                    : " You have no shields left — log in daily to keep your streak safe."}
                </p>

                {/* Warning if low/no shields */}
                {shieldsLeft === 0 && (
                  <div className="mb-5 px-3 py-2 border border-red-500/40 bg-red-500/10">
                    <p className="text-[10px] font-mono text-red-400 tracking-wider">
                      ⚠ NO SHIELDS REMAINING — earn more by reaching streak milestones or leveling up.
                    </p>
                  </div>
                )}
                {shieldsLeft === 1 && (
                  <div className="mb-5 px-3 py-2 border border-yellow-400/40 bg-yellow-400/10">
                    <p className="text-[10px] font-mono text-yellow-300 tracking-wider">
                      ⚡ 1 SHIELD LEFT — hit your 7, 14, or 30-day milestone to earn more.
                    </p>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-[#00c8ff]/10 border border-[#00c8ff]/50 text-[#00c8ff]
                    text-xs font-mono tracking-widest uppercase hover:bg-[#00c8ff]/20
                    hover:border-[#00c8ff] hover:shadow-[0_0_15px_rgba(0,200,255,0.4)]
                    transition-all"
                >
                  Continue — Day {streakDays}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
