import { useGetMe, useAdminGetStats, useAdminGetLeaderboard, useAdminListUsers } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Users, Database, ArrowLeft } from "lucide-react";

export default function AdminPage() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: stats } = useAdminGetStats();
  const { data: leaderboard } = useAdminGetLeaderboard();
  const { data: users } = useAdminListUsers();

  if (meLoading) return <div className="min-h-screen flex items-center justify-center font-mono text-primary">VERIFYING CLEARANCE...</div>;

  if (!me?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <div className="text-destructive font-mono text-2xl hud-glow drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">ACCESS DENIED</div>
        <p className="text-muted-foreground font-mono">You lack the required clearance level for this terminal.</p>
        <Link href="/dashboard" className="hud-button h-10 px-6 py-2 mt-4">RETURN TO DASHBOARD</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <header className="flex items-center justify-between mb-8 border-b border-destructive/30 pb-4">
        <div className="flex items-center gap-4">
          <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-destructive tracking-widest drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">COMMAND CENTER</h1>
            <div className="text-xs font-mono text-destructive/70">OVERSIGHT TERMINAL // LEVEL 10 CLEARANCE</div>
          </div>
        </div>
        <Link href="/dashboard" className="inline-flex items-center text-sm font-heading border border-primary/30 px-4 py-2 hover:bg-primary/10 transition-colors text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> EXIT ADMIN
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: "TOTAL USERS", val: stats?.totalUsers || 0 },
          { label: "ACTIVE USERS", val: stats?.activeUsers || 0 },
          { label: "AVG LEVEL", val: stats?.avgLevel?.toFixed(1) || 0 },
          { label: "AVG NET WORTH", val: `₹${stats?.avgNetWorth?.toLocaleString('en-IN') || 0}` },
          { label: "TOTAL QUESTS", val: stats?.totalQuests || 0 },
          { label: "TOTAL BUILDS", val: stats?.totalBuilds || 0 },
        ].map(s => (
          <Card key={s.label} className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-center">
              <div className="text-[10px] text-muted-foreground font-mono mb-1">{s.label}</div>
              <div className="text-xl font-heading font-bold text-destructive">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" /> GLOBAL LEADERBOARD
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>HUNTER</TableHead>
                  <TableHead className="text-right">LVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard?.map(entry => (
                  <TableRow key={entry.userId}>
                    <TableCell className="font-mono text-muted-foreground">{entry.rank}</TableCell>
                    <TableCell>
                      <div className="font-heading font-bold text-primary">{entry.displayName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{entry.tierRank || 'E'}-RANK</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-primary">{entry.level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" /> USER DATABASE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HUNTER</TableHead>
                  <TableHead>RANK</TableHead>
                  <TableHead className="text-right">NET WORTH (₹)</TableHead>
                  <TableHead className="text-right">QUESTS</TableHead>
                  <TableHead className="text-right">SKILLS</TableHead>
                  <TableHead>ROLE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-heading font-bold text-primary">{user.displayName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] rank-${user.rank?.toLowerCase() || 'e'}`}>{user.rank || 'E'}</Badge>
                      <span className="ml-2 font-mono text-xs">LVL {user.level}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-primary/80">{user.netWorth.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">{user.questCount}</TableCell>
                    <TableCell className="text-right font-mono">{user.skillCount}</TableCell>
                    <TableCell>
                      {user.isAdmin ? <Badge variant="destructive" className="text-[10px]">ADMIN</Badge> : <Badge variant="outline" className="text-[10px]">USER</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}