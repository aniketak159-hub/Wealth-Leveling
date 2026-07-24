import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dashboard } from "@workspace/api-client-react";
import { Terminal, Shield, Zap, Target } from "lucide-react";
import { useListQuests, useListSkills, useListBuilds } from "@workspace/api-client-react";
import EvaluationModal from "./EvaluationModal";
import StreakCard from "./StreakCard";

export default function OverviewTab({ dashboard }: { dashboard: Dashboard }) {
  const { data: quests } = useListQuests();
  const { data: skills } = useListSkills();
  const { data: builds } = useListBuilds();
  const [evalOpen, setEvalOpen] = useState(false);

  const activeQuests = quests?.filter(q => !q.completed) || [];
  const topSkills = skills?.sort((a, b) => b.level - a.level).slice(0, 3) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
      {/* LEFT COLUMN */}
      <div className="md:col-span-3 space-y-6 flex flex-col">
        {/* STATS PANEL */}
        <Card className="flex-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> CORE ATTRIBUTES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "STR", val: dashboard.stats.str, color: "bg-red-500", desc: "Growth" },
              { label: "VIT", val: dashboard.stats.vit, color: "bg-green-500", desc: "Stability" },
              { label: "INT", val: dashboard.stats.int, color: "bg-blue-500", desc: "Diversify" },
              { label: "AGI", val: dashboard.stats.agi, color: "bg-yellow-500", desc: "Savings" },
              { label: "PER", val: dashboard.stats.per, color: "bg-purple-500", desc: "Budget" },
              { label: "LUK", val: dashboard.stats.luk, color: "bg-orange-500", desc: "Emergency" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 text-sm">
                <div className="w-8 font-heading text-primary/80">{stat.label}</div>
                <div className="flex-1 h-1.5 bg-primary/10 relative">
                  <div className={`absolute top-0 left-0 h-full ${stat.color} shadow-[0_0_5px_currentColor]`} style={{ width: `${Math.min(100, (stat.val / 50) * 100)}%` }}></div>
                </div>
                <div className="w-6 text-right font-mono">{stat.val}</div>
              </div>
            ))}
            
            {dashboard.stats.unspentPoints > 0 && (
              <div className="mt-4 p-2 border border-warning/50 bg-warning/10 text-warning text-center text-xs animate-pulse font-mono cursor-pointer hover:bg-warning/20 transition-colors">
                {dashboard.stats.unspentPoints} UNSPENT POINTS AVAILABLE
              </div>
            )}
          </CardContent>
        </Card>

        {/* SYSTEM LOG */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4" /> SYSTEM LOG
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto font-mono text-[10px] md:text-xs text-primary/70 space-y-2 pb-0">
            {dashboard.systemLog.length > 0 ? (
              dashboard.systemLog.map((log, i) => (
                <div key={i} className="border-l border-primary/30 pl-2 opacity-80">
                  <span className="text-primary/40 mr-2">{'>'}</span>{log}
                </div>
              ))
            ) : (
              <div className="opacity-50 italic">No recent logs.</div>
            )}
            <div className="hud-cursor pt-2"></div>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE COLUMN */}
      <div className="md:col-span-6 space-y-6 flex flex-col">
        {/* MONTHLY EVALUATION CARD */}
        <Card className="bg-primary/5 border-primary/40 hud-glow-box">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg text-primary tracking-widest font-bold">MONTHLY EVALUATION</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">Submit your financial data for the month to calculate XP gains, level ups, and stat improvements.</p>
            </div>
            <Button size="lg" className="shrink-0 w-full md:w-auto" onClick={() => setEvalOpen(true)}>
              INITIATE SCAN
            </Button>
          </CardContent>
        </Card>

        <EvaluationModal open={evalOpen} onClose={() => setEvalOpen(false)} />

        {/* ACTIVE QUESTS */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" /> ACTIVE QUESTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeQuests.length > 0 ? (
              <div className="space-y-4">
                {activeQuests.map((quest) => (
                  <div key={quest.id} className="p-3 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-heading font-bold text-primary tracking-wider">{quest.title}</div>
                        <div className="text-xs text-muted-foreground">{quest.frequency} • {quest.category}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">+{quest.xpReward} XP</Badge>
                    </div>
                    {quest.targetAmount && (
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span>PROGRESS</span>
                          <span>{quest.currentAmount} / {quest.targetAmount}</span>
                        </div>
                        <Progress value={(quest.currentAmount / quest.targetAmount) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-primary/20 text-muted-foreground text-sm font-mono">
                NO ACTIVE QUESTS DETECTED
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="md:col-span-3 space-y-6 flex flex-col">
        {/* STREAK */}
        <StreakCard />

        {/* TOP SKILLS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> TOP SKILLS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSkills.length > 0 ? (
              topSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-2 bg-primary/5 border border-primary/10">
                  <div>
                    <div className="font-heading text-sm text-primary">{skill.name}</div>
                    <div className="text-[10px] text-muted-foreground">{skill.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-primary">LVL {skill.level}</div>
                    <div className="text-[10px] text-warning">{skill.streakCount} STREAK</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">No skills registered.</div>
            )}
          </CardContent>
        </Card>

        {/* GUILD HALL PREVIEW */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">GUILD HALL BUILDS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {builds && builds.length > 0 ? (
              builds.slice(0, 3).map((build) => {
                const isProfitable = (build.netProfit ?? 0) >= 0;
                return (
                  <div key={build.id} className="p-2 border border-primary/20 bg-black/40">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-heading text-sm">{build.name}</span>
                      <Badge className={`text-[10px] rank-${build.rank.toLowerCase()}`}>{build.rank}</Badge>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono mt-2">
                      <span className="text-muted-foreground">NET:</span>
                      <span className={isProfitable ? "text-success" : "text-destructive"}>
                        {isProfitable ? "+" : ""}₹{build.netProfit?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-primary/20">No active builds.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}