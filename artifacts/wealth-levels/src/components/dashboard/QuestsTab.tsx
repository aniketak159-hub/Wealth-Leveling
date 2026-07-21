import { useListQuests } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus } from "lucide-react";

export default function QuestsTab() {
  const { data: quests, isLoading } = useListQuests();

  if (isLoading) {
    return <div className="p-8 text-center text-primary font-mono hud-cursor">SCANNING ACTIVE MISSIONS...</div>;
  }

  const activeQuests = quests?.filter(q => !q.completed) || [];
  const completedQuests = quests?.filter(q => q.completed) || [];

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow">MISSION LOG</h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">Convert financial targets into actionable quests.</p>
        </div>
        <Button className="shrink-0"><Plus className="w-4 h-4 mr-2" /> CREATE QUEST</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVE */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg border-b border-primary/30 pb-2 text-primary/80">ACTIVE DIRECTIVES</h3>
          {activeQuests.length > 0 ? (
            activeQuests.map(quest => (
              <Card key={quest.id} className="bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-heading text-lg font-bold text-primary">{quest.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                    </div>
                    <Badge variant="outline">+{quest.xpReward} XP</Badge>
                  </div>
                  
                  <div className="flex gap-2 mt-4 mb-2">
                    <Badge variant="secondary" className="text-[10px]">{quest.category}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{quest.frequency}</Badge>
                  </div>

                  {quest.targetAmount !== null && quest.targetAmount > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-primary/20">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-muted-foreground">PROGRESS</span>
                        <span className="text-primary">{quest.currentAmount} / {quest.targetAmount}</span>
                      </div>
                      <Progress value={(quest.currentAmount / quest.targetAmount) * 100} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border border-dashed border-primary/20 text-muted-foreground font-mono">NO ACTIVE DIRECTIVES</div>
          )}
        </div>

        {/* COMPLETED */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg border-b border-primary/30 pb-2 text-primary/40">ARCHIVED (COMPLETED)</h3>
          {completedQuests.length > 0 ? (
            completedQuests.map(quest => (
              <Card key={quest.id} className="opacity-60 border-primary/20 bg-transparent">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-heading text-md line-through text-muted-foreground">{quest.title}</h4>
                    <span className="text-xs font-mono text-success">COMPLETED</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground/50 font-mono text-sm">NO ARCHIVES FOUND</div>
          )}
        </div>
      </div>
    </div>
  );
}