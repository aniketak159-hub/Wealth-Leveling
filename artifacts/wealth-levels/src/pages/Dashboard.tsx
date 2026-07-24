import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useGetDashboard, useGetDashboardSummary, useListQuests, useListSkills, useListBuilds, useGetBudget, useGetWealth, useRunEvaluation, useUpdateStats, useLogQuestProgress } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Database, Target, BookOpen, User, ShieldAlert, Cpu, BarChart } from "lucide-react";
import { useClerk } from "@clerk/react";
import StreakHUD, { type CheckinResult } from "@/components/dashboard/StreakHUD";
import StreakShieldModal from "@/components/StreakShieldModal";
import StreakResetModal from "@/components/StreakResetModal";

import OverviewTab from "@/components/dashboard/OverviewTab";
import StatsTab from "@/components/dashboard/StatsTab";
import WealthTab from "@/components/dashboard/WealthTab";
import QuestsTab from "@/components/dashboard/QuestsTab";
import BudgetTab from "@/components/dashboard/BudgetTab";
import SkillsTab from "@/components/dashboard/SkillsTab";

export default function DashboardPage() {
  const { data: me } = useGetMe();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { signOut } = useClerk();
  const [location, setLocation] = useLocation();
  const [shieldModal, setShieldModal] = useState<{ streakDays: number; shieldsLeft: number } | null>(null);
  const [resetModal, setResetModal] = useState<{ brokenAt: number } | null>(null);

  function handleCheckin(result: CheckinResult) {
    if (result.shieldBurned) {
      setShieldModal({ streakDays: result.streakDays, shieldsLeft: result.streakShields });
    } else if (result.streakReset) {
      setResetModal({ brokenAt: result.streakDays === 1 ? (result.longestStreak > 1 ? result.longestStreak : 0) : 0 });
    }
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-mono text-xl hud-cursor">LOADING SYSTEM DATA...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-destructive font-mono text-xl">ERROR: DASHBOARD CORRUPTED</div>
        <Button onClick={() => window.location.reload()}>REBOOT SYSTEM</Button>
      </div>
    );
  }

  const rankColorMap: Record<string, string> = {
    'S': 'rank-s',
    'A': 'rank-a',
    'B': 'rank-b',
    'C': 'rank-c',
    'D': 'rank-d',
    'E': 'rank-e'
  };

  const rankClass = dashboard.rank ? rankColorMap[dashboard.rank] : 'rank-e';
  const xpPercent = (dashboard.xp / dashboard.xpToNext) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top HUD Header */}
      <header className="w-full border-b border-primary/30 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-2">
          {/* Row 1: avatar + name + actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 border-2 border-primary hud-glow-box bg-primary/10 flex items-center justify-center p-0.5">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-primary w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-heading font-bold text-primary tracking-widest truncate">{dashboard.displayName}</h1>
                  <Badge variant={dashboard.rank?.toLowerCase() as any} className={rankClass}>{dashboard.rank}-RANK</Badge>
                </div>
                <div className="text-[10px] sm:text-xs font-mono tracking-widest text-muted-foreground truncate">{dashboard.title}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Streak HUD */}
              <StreakHUD onCheckin={handleCheckin} />

              {/* Net worth — hidden on xs, shown sm+ */}
              <div className="hidden sm:block text-right mr-2">
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest">NET WORTH</div>
                <div className="text-base font-mono text-primary hud-glow">₹{dashboard.netWorth.toLocaleString('en-IN')}</div>
              </div>
              <div className="flex gap-1.5 border-l border-primary/30 pl-3">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation("/profile")} title="My Profile">
                  <User className="w-3.5 h-3.5" />
                </Button>
                {me?.isAdmin && (
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin")} title="Admin Panel">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => signOut({ redirectUrl: "/" })} title="Logout">
                  <LogOut className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: XP bar + net worth on xs */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px] sm:text-xs font-mono tracking-widest">
                <span className="text-primary">LVL {dashboard.level}</span>
                <span className="text-primary/70">{dashboard.xp} / {dashboard.xpToNext} XP</span>
              </div>
              <Progress value={xpPercent} className="h-2" />
            </div>
            {/* Net worth inline on xs only */}
            <div className="sm:hidden text-right shrink-0">
              <div className="text-[10px] font-mono text-muted-foreground">NET WORTH</div>
              <div className="text-sm font-mono text-primary hud-glow">₹{dashboard.netWorth.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Streak modals */}
      <StreakShieldModal
        open={!!shieldModal}
        streakDays={shieldModal?.streakDays ?? 0}
        shieldsLeft={shieldModal?.shieldsLeft ?? 0}
        onClose={() => setShieldModal(null)}
      />
      <StreakResetModal
        open={!!resetModal}
        brokenAt={resetModal?.brokenAt ?? 0}
        onClose={() => setResetModal(null)}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 overflow-hidden">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
          <TabsList className="flex overflow-x-auto mb-4 sm:mb-6 bg-transparent border-0 h-auto p-0 gap-1.5 sm:gap-2 scrollbar-none">
            {[
              { value: "overview", icon: LayoutDashboard, label: "OVERVIEW" },
              { value: "stats",    icon: Cpu,             label: "STATS" },
              { value: "wealth",   icon: Database,        label: "WEALTH" },
              { value: "quests",   icon: Target,          label: "QUESTS" },
              { value: "budget",   icon: BarChart,        label: "BUDGET" },
              { value: "skills",   icon: BookOpen,        label: "SKILLS" },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value}
                className="shrink-0 flex items-center gap-1.5 h-9 px-3 sm:px-4 text-[10px] sm:text-xs data-[state=active]:bg-primary/20 border border-primary/20 whitespace-nowrap">
                <Icon className="w-3.5 h-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 w-full relative">
            <TabsContent value="overview" className="mt-0 h-full">
              <OverviewTab dashboard={dashboard} />
            </TabsContent>
            <TabsContent value="stats" className="mt-0 h-full">
              <StatsTab dashboard={dashboard} />
            </TabsContent>
            <TabsContent value="wealth" className="mt-0 h-full">
              <WealthTab />
            </TabsContent>
            <TabsContent value="quests" className="mt-0 h-full">
              <QuestsTab />
            </TabsContent>
            <TabsContent value="budget" className="mt-0 h-full">
              <BudgetTab />
            </TabsContent>
            <TabsContent value="skills" className="mt-0 h-full">
              <SkillsTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}