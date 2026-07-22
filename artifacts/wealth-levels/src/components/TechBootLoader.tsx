import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUpRight, BrainCircuit, CircleDollarSign, ShieldCheck } from "lucide-react";

const lessons = [
  {
    code: "01 // BUILD THE BASE",
    title: "Secure your cash flow",
    body: "Track every rupee. A player cannot level up what the system cannot measure.",
    icon: CircleDollarSign,
  },
  {
    code: "02 // COMPLETE THE QUEST",
    title: "Turn goals into streaks",
    body: "Small, repeatable deposits compound into the XP that moves your wealth rank.",
    icon: Activity,
  },
  {
    code: "03 // ALLOCATE YOUR STATS",
    title: "Make every rupee work",
    body: "Balance liquidity, protection, growth, and knowledge before chasing the next tier.",
    icon: BrainCircuit,
  },
  {
    code: "04 // PROMOTE THE PLAYER",
    title: "Compound your advantage",
    body: "Review your net worth, unlock stronger builds, and let consistency become power.",
    icon: ArrowUpRight,
  },
];

export default function TechBootLoader() {
  const [progress, setProgress] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lesson = useMemo(() => lessons[lessonIndex], [lessonIndex]);
  const LessonIcon = lesson.icon;

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 2.5, 100));
    }, 85);
    const lessonTimer = window.setInterval(() => {
      setLessonIndex((value) => (value + 1) % lessons.length);
    }, 2200);
    const closeTimer = window.setTimeout(() => setVisible(false), 4200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(lessonTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(12px)" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] overflow-hidden bg-[#050914] text-primary"
          aria-label="Loading Wealth Leveling"
          role="status"
        >
          <div className="boot-scanline" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,200,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,200,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
          <motion.div
            className="absolute -left-32 top-1/2 h-64 w-[140%] bg-primary/10 blur-3xl"
            animate={{ x: ["-8%", "8%", "-8%"], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col justify-between px-6 py-8 md:px-12 md:py-10">
            <header className="flex items-center justify-between border-b border-primary/20 pb-5 font-mono text-[10px] tracking-[0.28em] text-primary/60">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_14px_#00c8ff]" />
                WEALTH LEVELING // CORE OS
              </div>
              <span>SECURE BOOT / 0x7F2A</span>
            </header>

            <main className="grid items-center gap-12 py-12 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
              <div>
                <div className="mb-7 flex items-center gap-3 font-mono text-xs tracking-[0.3em] text-primary/60">
                  <ShieldCheck className="h-4 w-4" />
                  PLAYER TRAINING PROTOCOL
                </div>
                <h1 className="max-w-xl font-heading text-4xl font-black leading-[1.05] tracking-wider text-primary md:text-6xl">
                  LEVEL YOUR
                  <br />
                  <span className="text-foreground">FINANCIAL POWER.</span>
                </h1>
                <p className="mt-6 max-w-md font-mono text-sm leading-7 tracking-wide text-primary/60">
                  Initializing your command center. Read the system instructions and turn financial intent into measurable progress.
                </p>
                <div className="mt-10 max-w-md">
                  <div className="mb-2 flex justify-between font-mono text-[10px] tracking-[0.2em] text-primary/60">
                    <span>SYNCING PLAYER PROFILE</span>
                    <span>{Math.round(progress).toString().padStart(3, "0")}%</span>
                  </div>
                  <div className="h-1 bg-primary/10">
                    <motion.div className="h-full bg-primary shadow-[0_0_14px_#00c8ff]" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="hud-panel-inner relative min-h-[260px] border border-primary/30 bg-primary/[0.04] p-6 md:p-10">
                <div className="mb-10 flex items-center justify-between border-b border-primary/20 pb-4 font-mono text-[10px] tracking-[0.24em] text-primary/50">
                  <span>FINANCIAL LEVELING MANUAL</span>
                  <span>LIVE LESSON {String(lessonIndex + 1).padStart(2, "0")}/{lessons.length}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lesson.code}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35 }}
                  >
                    <LessonIcon className="mb-6 h-8 w-8 text-primary drop-shadow-[0_0_10px_#00c8ff]" />
                    <div className="mb-3 font-mono text-[10px] tracking-[0.25em] text-primary/50">{lesson.code}</div>
                    <h2 className="font-heading text-2xl font-bold tracking-wider text-foreground md:text-3xl">{lesson.title}</h2>
                    <p className="mt-5 max-w-lg font-mono text-sm leading-7 tracking-wide text-primary/60">{lesson.body}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-10 flex gap-2">
                  {lessons.map((item, index) => (
                    <div key={item.code} className={`h-1 flex-1 transition-colors ${index <= lessonIndex ? "bg-primary shadow-[0_0_8px_#00c8ff]" : "bg-primary/15"}`} />
                  ))}
                </div>
              </div>
            </main>

            <footer className="flex items-center justify-between border-t border-primary/20 pt-5 font-mono text-[10px] tracking-[0.22em] text-primary/40">
              <span>NO SHORTCUTS // ONLY COMPOUNDING</span>
              <span className="hidden md:inline">WELCOME, PLAYER_01</span>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}