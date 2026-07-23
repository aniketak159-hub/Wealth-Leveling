import * as React from "react"
import { Link } from "wouter"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, Target, TrendingUp, Zap, BarChart } from "lucide-react"

export default function Home() {
  const features = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: "Quest System",
      description: "Convert financial goals into trackable missions. Earn XP for every deposit.",
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Skill Trees",
      description: "Level up your Investment, Savings, and Knowledge skills through consistent streaks.",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Guild Hall",
      description: "Manage passive income builds. Treat your assets like production facilities.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Stat Allocation",
      description: "Gain stats on level up. Will you pump STR for growth or VIT for stability?",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-4 sm:px-6 py-4 border-b border-primary/20 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-heading text-base sm:text-xl font-bold tracking-widest text-primary hud-glow">WEALTH LEVELING</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Link href="/sign-in" className="inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-heading font-medium uppercase tracking-widest border border-primary/30 bg-transparent hover:bg-primary/10 text-primary h-9 px-3 sm:px-4 py-2 transition-all">Sign In</Link>
          <Link href="/sign-up" className="inline-flex items-center justify-center whitespace-nowrap text-xs sm:text-sm font-heading font-medium uppercase tracking-widest hud-button h-9 px-3 sm:px-4 py-2">Initialize</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full max-w-6xl px-6 py-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hud-panel p-2 inline-block mb-6"
        >
          <span className="text-primary text-xs font-mono tracking-widest px-2 hud-cursor">SYSTEM ONLINE // PROTOCOL ACTIVE</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 max-w-4xl"
        >
          TREAT YOUR NET WORTH LIKE A <span className="text-primary hud-glow">POWER LEVEL</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground text-sm md:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-mono"
        >
          A gamified financial command center. Track your assets, complete savings quests, allocate stats, and rise through the ranks from E-Tier Novice to S-Rank Titan.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link href="/sign-up" className="inline-flex items-center justify-center whitespace-nowrap text-lg font-heading font-medium uppercase tracking-widest hud-button h-14 px-8 py-2">
            Enter the System
          </Link>
        </motion.div>
      </section>

      {/* Stats Preview */}
      <section className="w-full py-12 bg-primary/5 border-y border-primary/20 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {[
            { label: "Total Players", val: "14,204" },
            { label: "Active Quests", val: "89,112" },
            { label: "Avg Net Worth", val: "₹1.4M" },
            { label: "System Status", val: "OPTIMAL" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center hud-panel"
            >
              <div className="text-3xl font-heading font-bold text-primary mb-2 hud-glow">{stat.val}</div>
              <div className="text-xs text-muted-foreground tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold mb-4">SYSTEM CAPABILITIES</h2>
          <div className="w-24 h-1 bg-primary/50 mx-auto hud-glow-box"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hud-panel p-8 flex items-start gap-6 hover:bg-primary/10 transition-colors duration-500"
            >
              <div className="p-4 rounded bg-primary/10 border border-primary/30 hud-glow-box shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-primary mb-2 tracking-widest">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-primary/20 py-8 bg-black/40 text-center">
        <p className="text-primary/50 text-xs font-mono tracking-widest">
          © {new Date().getFullYear()} WEALTH LEVELING // ENCRYPTED CONNECTION
        </p>
      </footer>
    </div>
  );
}