import { useState } from "react";
import { useGetWealth } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, Plus, Upload } from "lucide-react";
import ImportStatementModal from "@/components/import/ImportStatementModal";
import BankConnectPanel from "@/components/import/BankConnectPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function WealthTab() {
  const [importOpen, setImportOpen] = useState(false);
  const { data: wealth, isLoading } = useGetWealth();

  if (isLoading) {
    return <div className="p-8 text-center text-primary font-mono hud-cursor">LOADING WEALTH DATA...</div>;
  }

  if (!wealth) {
    return <div className="p-8 text-center text-destructive font-mono">NO WEALTH DATA DETECTED</div>;
  }

  const COLORS = {
    STOCKS: '#3b82f6',
    MUTUAL_FUNDS: '#8b5cf6',
    REAL_ESTATE: '#22c55e',
    CASH: '#eab308',
    CRYPTO: '#f97316',
    OTHER: '#64748b'
  };

  const pieData = wealth.assets.map(a => ({
    name: a.category,
    value: a.amount,
    color: COLORS[a.category as keyof typeof COLORS] || COLORS.OTHER
  }));

  // Aggregate by category for chart
  const aggregatedData: { name: string; value: number; color: string }[] = Object.values(
    pieData.reduce<Record<string, { name: string; value: number; color: string }>>((acc, curr) => {
      if (!acc[curr.name]) acc[curr.name] = { name: curr.name, value: 0, color: curr.color };
      acc[curr.name].value += curr.value;
      return acc;
    }, {})
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-primary/20">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> ASSET MANIFEST
            </CardTitle>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1"/> IMPORT
          </Button>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ASSET LABEL</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead className="text-right">VALUATION (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wealth.assets.length > 0 ? (
                  wealth.assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-heading font-medium text-primary">{asset.label}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{asset.category.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-mono text-primary/90">{asset.amount.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-mono border-dashed border-b-0">
                      NO ASSETS LOGGED. SYSTEM STANDBY.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-4 flex flex-col gap-6">
        <Card className="bg-primary/5 hud-glow-box">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">TOTAL NET WORTH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-mono font-bold text-primary hud-glow break-all">
              ₹{wealth.netWorth.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-[300px]">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center p-4">
            {aggregatedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {aggregatedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'rgba(8, 13, 26, 0.9)', border: '1px solid #00c8ff', borderRadius: '0' }}
                    itemStyle={{ color: '#00c8ff', fontFamily: 'Share Tech Mono' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground font-mono text-sm">INSUFFICIENT DATA</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <BankConnectPanel />
      </div>

      <ImportStatementModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}