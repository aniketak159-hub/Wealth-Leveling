/**
 * StreakResetModal
 * Shown when a streak breaks (no shields). Motivational — not punishing.
 * Frame the reset as a new beginning, not a failure.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Flame, RotateCcw } from "lucide-react";

interface Props {
  open: boolean;
  brokenAt: number;
  onClose: () => void;
}

export default function StreakResetModal({ open, brokenAt, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="reset-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full max-w-sm mx-4 bg-[#080d1a] border border-red-500/40
              shadow-[0_0_40px_rgba(255,0,0,0.1)] p-8 text-center"
          >
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-500/50" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-500/50" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-500/50" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-500/50" />

            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 border-2 border-red-500/50 bg-red-500/10 flex items-center justify-center">
                <Flame className="w-8 h-8 text-red-400/70" />
              </div>
            </div>

            <div className="text-[10px] font-mono tracking-[0.35em] text-red-400/60 uppercase mb-2">
              STREAK INTERRUPTED
            </div>
            <div className="font-heading text-xl tracking-widest text-red-400 uppercase mb-4">
              {brokenAt > 0 ? `${brokenAt}-Day Streak Lost` : "Streak Reset"}
            </div>

            <p className="text-xs font-mono text-[#66a3cc] leading-relaxed mb-2">
              Every legend has a respawn point. Streak Shields protect against missed days —
              earn them by reaching milestones and leveling up.
            </p>
            <p className="text-xs font-mono text-[#66a3cc]/70 leading-relaxed mb-6">
              Your new streak starts today. Day 1.
            </p>

            <div className="flex items-center gap-2 mb-5 px-3 py-2 border border-[#00c8ff]/20 bg-[#00c8ff]/5">
              <div className="text-[10px] font-mono text-[#00c8ff]/70 tracking-wider text-left">
                Reach Day 3 to earn your first Streak Shield automatically.
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3
                bg-red-500/10 border border-red-500/40 text-red-400
                text-xs font-mono tracking-widest uppercase hover:bg-red-500/20
                hover:border-red-500/60 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start Day 1
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
