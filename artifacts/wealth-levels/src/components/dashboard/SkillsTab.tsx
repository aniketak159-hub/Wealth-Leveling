import { useListSkills } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Plus, Activity } from "lucide-react";

export default function SkillsTab() {
  const { data: skills, isLoading } = useListSkills();

  if (isLoading) {
    return <div className="p-8 text-center text-primary font-mono hud-cursor">LOADING SKILL TREES...</div>;
  }

  const investmentSkills = skills?.filter(s => s.category === "INVESTMENT") || [];
  const savingsSkills = skills?.filter(s => s.category === "SAVINGS") || [];
  const knowledgeSkills = skills?.filter(s => s.category === "KNOWLEDGE") || [];

  const SkillSection = ({ title, data }: { title: string, data: typeof skills }) => (
    <Card className="flex-1 bg-transparent border-primary/30">
      <CardHeader className="pb-2 border-b border-primary/20 bg-primary/5">
        <CardTitle className="text-sm tracking-widest">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {data && data.length > 0 ? (
          data.map(skill => (
            <div key={skill.id} className="border border-primary/10 p-3 bg-black/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-100 transition-opacity">
                <Activity className="w-24 h-24 text-primary absolute -top-4 -right-4" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-heading font-bold text-primary">{skill.name}</h4>
                  <Badge variant="outline" className="bg-primary/5">LVL {skill.level}</Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs font-mono mt-4">
                  <span className="text-warning">{skill.streakCount} DAY STREAK</span>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 py-0 border-primary/30 hover:border-primary">LOG CHECK-IN</Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs font-mono border border-dashed border-primary/20">
            TREE BRANCH EMPTY
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary tracking-widest hud-glow flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> NEURAL PATTERNS (SKILLS)
          </h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">Develop habits to permanently increase your financial power.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> ADD SKILL</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkillSection title="INVESTMENT TREE" data={investmentSkills} />
        <SkillSection title="SAVINGS TREE" data={savingsSkills} />
        <SkillSection title="KNOWLEDGE TREE" data={knowledgeSkills} />
      </div>
    </div>
  );
}