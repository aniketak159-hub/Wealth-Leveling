import { useState } from "react";
import { Dashboard } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus } from "lucide-react";
import { useUpdateStats } from "@workspace/api-client-react";

export default function StatsTab({ dashboard }: { dashboard: Dashboard }) {
  const updateStats = useUpdateStats();
  const [allocations, setAllocations] = useState({
    str: 0, vit: 0, int: 0, agi: 0, per: 0, luk: 0
  });

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remainingPoints = dashboard.stats.unspentPoints - totalAllocated;

  const handleAllocate = (stat: keyof typeof allocations, delta: number) => {
    if (delta > 0 && remainingPoints <= 0) return;
    if (delta < 0 && allocations[stat] <= 0) return;
    
    setAllocations(prev => ({
      ...prev,
      [stat]: prev[stat] + delta
    }));
  };

  const handleCommit = () => {
    if (totalAllocated <= 0) return;
    updateStats.mutate({ data: allocations }, {
      onSuccess: () => {
        setAllocations({ str: 0, vit: 0, int: 0, agi: 0, per: 0, luk: 0 });
      }
    });
  };

  const statDefs = [
    { key: 'str', label: 'STR - Investment Growth', desc: 'Represents capital appreciation and aggressive investment strategies.', color: 'text-red-500', bg: 'bg-red-500' },
    { key: 'vit', label: 'VIT - Net Worth Stability', desc: 'Represents overall financial health, debt reduction, and resilience.', color: 'text-green-500', bg: 'bg-green-500' },
    { key: 'int', label: 'INT - Diversification', desc: 'Represents knowledge, varied income streams, and asset spread.', color: 'text-blue-500', bg: 'bg-blue-500' },
    { key: 'agi', label: 'AGI - Savings Rate', desc: 'Represents liquidity, cash flow optimization, and speed of saving.', color: 'text-yellow-500', bg: 'bg-yellow-500' },
    { key: 'per', label: 'PER - Budget Discipline', desc: 'Represents tracking accuracy, avoiding lifestyle creep, and mindful spending.', color: 'text-purple-500', bg: 'bg-purple-500' },
    { key: 'luk', label: 'LUK - Emergency Fund', desc: 'Represents preparation for the unexpected. A higher emergency fund increases luck.', color: 'text-orange-500', bg: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-lg text-warning tracking-widest font-bold">UNSPENT POINTS: <span className="text-3xl ml-2">{remainingPoints}</span></h3>
            <p className="text-xs text-warning/70 mt-1">Allocate points carefully. Stats influence your overall Hunter Tier.</p>
          </div>
          <Button 
            onClick={handleCommit} 
            disabled={totalAllocated === 0 || updateStats.isPending}
            className="bg-warning/20 text-warning border-warning hover:bg-warning/30"
          >
            {updateStats.isPending ? "COMMITTING..." : "COMMIT ALLOCATION"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {statDefs.map((s) => {
          const baseVal = dashboard.stats[s.key as keyof typeof allocations];
          const allocatedVal = allocations[s.key as keyof typeof allocations];
          const totalVal = baseVal + allocatedVal;
          
          return (
            <Card key={s.key} className="flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-heading font-bold text-lg tracking-widest ${s.color}`}>{s.label}</h4>
                    <div className="text-2xl font-mono text-primary font-bold">
                      {baseVal}
                      {allocatedVal > 0 && <span className="text-warning text-lg ml-1">+{allocatedVal}</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 h-10">{s.desc}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="h-2 w-full bg-primary/10 relative">
                    <div className={`absolute top-0 left-0 h-full ${s.bg} opacity-50`} style={{ width: `${Math.min(100, (baseVal / 100) * 100)}%` }}></div>
                    {allocatedVal > 0 && (
                      <div className="absolute top-0 h-full bg-warning shadow-[0_0_10px_rgba(250,204,21,0.8)]" style={{ left: `${(baseVal / 100) * 100}%`, width: `${(allocatedVal / 100) * 100}%` }}></div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAllocate(s.key as keyof typeof allocations, -1)}
                      disabled={allocatedVal <= 0}
                      className="w-10 h-10 p-0 text-xl font-mono"
                    >
                      -
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAllocate(s.key as keyof typeof allocations, 1)}
                      disabled={remainingPoints <= 0}
                      className="w-10 h-10 p-0 text-xl font-mono"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}