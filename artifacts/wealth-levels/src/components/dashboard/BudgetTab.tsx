import { useGetBudget } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Edit2 } from "lucide-react";

export default function BudgetTab() {
  const { data: budget, isLoading } = useGetBudget();

  if (isLoading) {
    return <div className="p-8 text-center text-primary font-mono hud-cursor">CALCULATING CASH FLOW...</div>;
  }

  if (!budget) {
    return <div className="p-8 text-center text-destructive font-mono">BUDGET MODULE OFFLINE</div>;
  }

  const totalPlanned = budget.items.reduce((acc, item) => acc + item.planned, 0);
  const totalActual = budget.items.reduce((acc, item) => acc + item.actual, 0);
  
  const incomeRemaining = budget.monthlyIncome - totalActual;
  const healthPercent = Math.max(0, Math.min(100, (totalActual / budget.monthlyIncome) * 100));

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground font-mono mb-1">MONTHLY INFLOW</div>
            <div className="text-2xl font-mono text-success hud-glow">₹{budget.monthlyIncome.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL OUTFLOW</div>
            <div className="text-2xl font-mono text-destructive hud-glow">₹{totalActual.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="p-6">
            <div className="text-xs text-muted-foreground font-mono mb-1">RESERVES REMAINING</div>
            <div className="text-2xl font-mono text-primary hud-glow">₹{incomeRemaining.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/20">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart className="w-4 h-4" /> ALLOCATION MATRIX
          </CardTitle>
          <Button size="sm" variant="outline"><Edit2 className="w-4 h-4 mr-2"/> EDIT MATRIX</Button>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="px-4 pb-6 space-y-2 border-b border-primary/20 mb-4">
            <div className="flex justify-between text-xs font-mono">
              <span>GLOBAL BURN RATE</span>
              <span className={healthPercent > 90 ? "text-destructive" : "text-primary"}>{healthPercent.toFixed(1)}% OF INFLOW</span>
            </div>
            <Progress value={healthPercent} indicatorColor={healthPercent > 90 ? "bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)]" : undefined} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CATEGORY</TableHead>
                <TableHead className="text-right">PLANNED</TableHead>
                <TableHead className="text-right">ACTUAL</TableHead>
                <TableHead className="w-[30%]">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.items.length > 0 ? (
                budget.items.map((item) => {
                  const percent = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                  const isOver = item.actual > item.planned;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-heading font-medium text-primary">{item.label}</TableCell>
                      <TableCell className="text-right font-mono">₹{item.planned.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono">₹{item.actual.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(100, percent)} 
                            className="h-1.5" 
                            indicatorColor={isOver ? "bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.8)]" : undefined} 
                          />
                          <span className={`text-[10px] font-mono w-10 text-right ${isOver ? 'text-destructive' : 'text-primary/70'}`}>
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono border-dashed border-b-0">
                    NO ALLOCATIONS DEFINED.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}