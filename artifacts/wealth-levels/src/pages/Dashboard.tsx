import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useGetDashboard, useGetDashboardSummary, useListQuests, useListSkills, useListBuilds, useGetBudget, useGetWealth, useRunEvaluation, useUpdateStats, useLogQuestProgress } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Database, Target, BookOpen, User, Settings, ShieldAlert, Cpu, BarChart } from "lucide-react";
import { useClerk } from "@clerk/react";

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
      <header className="w-full border-b border-primary/30 bg-black/40 backdrop-blur-md sticky top-0 z-50 p-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-2 border-primary hud-glow-box bg-primary/10 flex items-center justify-center p-1">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="text-primary w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-bold text-primary tracking-widest">{dashboard.displayName}</h1>
                <Badge variant={dashboard.rank?.toLowerCase() as any} className={rankClass}>{dashboard.rank}-RANK</Badge>
              </div>
              <div className="text-xs font-mono tracking-widest text-muted-foreground">{dashboard.title}</div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md mx-8 flex flex-col gap-1">
            <div className="flex justify-between text-xs font-mono tracking-widest">
              <span className="text-primary">LVL {dashboard.level}</span>
              <span className="text-primary/70">{dashboard.xp} / {dashboard.xpToNext} XP</span>
            </div>
            <Progress value={xpPercent} className="h-3" />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-mono text-muted-foreground tracking-widest">NET WORTH</div>
              <div className="text-xl font-mono text-primary hud-glow">₹{dashboard.netWorth.toLocaleString('en-IN')}</div>
            </div>
            <div className="flex gap-2 border-l border-primary/30 pl-4">
              {me?.isAdmin && (
                <Button variant="outline" size="icon" onClick={() => setLocation("/admin")} title="Admin Panel">
                  <ShieldAlert className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => signOut({ redirectUrl: "/" })} title="Logout">
                <LogOut className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 overflow-hidden">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 bg-transparent border-0 h-auto p-0 gap-2">
            <TabsTrigger value="overview" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><LayoutDashboard className="w-4 h-4 mr-2 hidden md:block" /> OVERVIEW</TabsTrigger>
            <TabsTrigger value="stats" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><Cpu className="w-4 h-4 mr-2 hidden md:block" /> STATS</TabsTrigger>
            <TabsTrigger value="wealth" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><Database className="w-4 h-4 mr-2 hidden md:block" /> WEALTH</TabsTrigger>
            <TabsTrigger value="quests" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><Target className="w-4 h-4 mr-2 hidden md:block" /> QUESTS</TabsTrigger>
            <TabsTrigger value="budget" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><BarChart className="w-4 h-4 mr-2 hidden md:block" /> BUDGET</TabsTrigger>
            <TabsTrigger value="skills" className="h-10 data-[state=active]:bg-primary/20 border border-primary/20"><BookOpen className="w-4 h-4 mr-2 hidden md:block" /> SKILLS</TabsTrigger>
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