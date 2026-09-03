import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  BuildInputRank,
  type Build,
  getListBuildsQueryKey,
  useCreateBuild,
  useDeleteBuild,
  useListBuilds,
  useUpdateBuild,
} from "@workspace/api-client-react";
import { Activity, Coins, Edit3, Landmark, Plus, RefreshCw, Shield, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const buildFormSchema = z.object({
  name: z.string().trim().min(1, "Dungeon name is required"),
  description: z.string().trim().min(1, "Add a short description"),
  rank: z.enum(["S", "A", "B", "C", "D", "E"]),
  revenue: z.coerce.number().min(0, "Revenue cannot be negative"),
  expenses: z.coerce.number().min(0, "Expenses cannot be negative"),
});

type BuildFormValues = z.infer<typeof buildFormSchema>;

const emptyForm: BuildFormValues = {
  name: "",
  description: "",
  rank: "E",
  revenue: 0,
  expenses: 0,
};

const rankClass: Record<BuildFormValues["rank"], string> = {
  S: "rank-s",
  A: "rank-a",
  B: "rank-b",
  C: "rank-c",
  D: "rank-d",
  E: "rank-e",
};

const money = (value: number) =>
  `₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function BuildForm({
  build,
  onClose,
}: {
  build: Build | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const createBuild = useCreateBuild();
  const updateBuild = useUpdateBuild();
  const form = useForm<BuildFormValues>({
    resolver: zodResolver(buildFormSchema),
    defaultValues: build
      ? {
          name: build.name,
          description: build.description,
          rank: build.rank,
          revenue: build.revenue,
          expenses: build.expenses,
        }
      : emptyForm,
  });

  const isEditing = Boolean(build);
  const isPending = createBuild.isPending || updateBuild.isPending;
  const mutationError = createBuild.error || updateBuild.error;

  useEffect(() => {
    form.reset(build
      ? {
          name: build.name,
          description: build.description,
          rank: build.rank,
          revenue: build.revenue,
          expenses: build.expenses,
        }
      : emptyForm);
  }, [build, form]);

  const submit = (values: BuildFormValues) => {
    const data = {
      name: values.name,
      description: values.description,
      rank: values.rank as typeof BuildInputRank[keyof typeof BuildInputRank],
      revenue: values.revenue,
      expenses: values.expenses,
    };

    const options = {
      onSuccess: onClose,
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: getListBuildsQueryKey() });
      },
    };

    if (build) {
      updateBuild.mutate({ id: build.id, data }, options);
    } else {
      createBuild.mutate({ data }, options);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-5"
        data-testid={isEditing ? "form-edit-dungeon" : "form-create-dungeon"}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dungeon name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Example: Productized design studio"
                  data-testid="input-dungeon-name"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mission brief</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="What does this income stream do?"
                  className="min-h-[82px] border-primary/30 bg-primary/5 text-primary placeholder:text-muted-foreground"
                  data-testid="input-dungeon-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="rank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rank</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-dungeon-rank">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(BuildInputRank).map((rank) => (
                      <SelectItem key={rank} value={rank} data-testid={`option-dungeon-rank-${rank}`}>
                        {rank}-RANK
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly revenue</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    data-testid="input-dungeon-revenue"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expenses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly expenses</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    data-testid="input-dungeon-expenses"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {mutationError && (
          <div className="border border-destructive/40 bg-destructive/10 p-3 text-xs font-mono text-destructive" data-testid="status-dungeon-mutation-error">
            COMMAND FAILED: {String(mutationError)}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} data-testid="button-cancel-dungeon">
            CANCEL
          </Button>
          <Button type="submit" disabled={isPending} data-testid={isEditing ? "button-save-dungeon" : "button-create-dungeon"}>
            {isPending ? "UPLOADING..." : isEditing ? "SAVE CHANGES" : "DEPLOY DUNGEON"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function BuildsTab() {
  const { data: builds, isLoading, isError, error, refetch } = useListBuilds();
  const queryClient = useQueryClient();
  const deleteBuild = useDeleteBuild();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Build | null>(null);

  const totals = useMemo(() => {
    const records = builds ?? [];
    const revenue = records.reduce((total, build) => total + (build.revenue || 0), 0);
    const expenses = records.reduce((total, build) => total + (build.expenses || 0), 0);
    return { revenue, expenses, net: revenue - expenses };
  }, [builds]);

  const openCreate = () => {
    setEditingBuild(null);
    setEditorOpen(true);
  };

  const openEdit = (build: Build) => {
    setEditingBuild(build);
    setEditorOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteBuild.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => setDeleteTarget(null),
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: getListBuildsQueryKey() });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="status-dungeons-loading">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse bg-primary/15" />
            <div className="h-4 w-80 animate-pulse bg-primary/10" />
          </div>
          <div className="h-10 w-40 animate-pulse bg-primary/15" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse border border-primary/10 bg-primary/5" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((item) => <div key={item} className="h-52 animate-pulse border border-primary/10 bg-primary/5" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="hud-panel min-h-[320px] flex flex-col items-center justify-center gap-5 text-center" data-testid="status-dungeons-error">
        <Activity className="h-8 w-8 text-destructive" />
        <div>
          <h2 className="text-xl text-destructive">DUNGEON MAP UNAVAILABLE</h2>
          <p className="mt-2 max-w-md text-xs font-mono text-muted-foreground">
            The income-stream registry did not respond. Your saved numbers are unchanged.
          </p>
          <p className="mt-2 text-[10px] font-mono text-destructive/70">{String(error)}</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} data-testid="button-retry-dungeons">
          <RefreshCw className="mr-2 h-4 w-4" /> RETRY SCAN
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="panel-dungeons">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono tracking-[0.28em] text-primary/60">
            <span className="h-px w-8 bg-primary/50" /> INCOME STREAM REGISTRY
          </div>
          <h2 className="text-2xl font-heading font-bold tracking-[0.18em] text-primary hud-glow">DUNGEONS</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Treat each revenue stream like a mission. Keep the numbers current; the net profit is calculated for you.
          </p>
        </div>
        <Button onClick={openCreate} className="hud-button shrink-0" data-testid="button-open-create-dungeon">
          <Plus className="mr-2 h-4 w-4" /> NEW DUNGEON
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-primary/25 bg-primary/5" data-testid="metric-dungeon-count">
          <CardContent className="p-4">
            <div className="text-[10px] font-mono text-muted-foreground">ACTIVE DUNGEONS</div>
            <div className="mt-2 text-2xl font-heading text-primary">{builds?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5" data-testid="metric-dungeon-revenue">
          <CardContent className="p-4">
            <div className="text-[10px] font-mono text-muted-foreground">MONTHLY REVENUE</div>
            <div className="mt-2 text-lg font-mono text-success">{money(totals.revenue)}</div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5" data-testid="metric-dungeon-expenses">
          <CardContent className="p-4">
            <div className="text-[10px] font-mono text-muted-foreground">MONTHLY EXPENSES</div>
            <div className="mt-2 text-lg font-mono text-warning">{money(totals.expenses)}</div>
          </CardContent>
        </Card>
        <Card className={totals.net >= 0 ? "border-primary/40 bg-primary/10 hud-glow-box" : "border-destructive/40 bg-destructive/5"} data-testid="metric-dungeon-net-profit">
          <CardContent className="p-4">
            <div className="text-[10px] font-mono text-muted-foreground">TOTAL NET PROFIT</div>
            <div className={`mt-2 text-lg font-mono ${totals.net >= 0 ? "text-primary" : "text-destructive"}`}>
              {totals.net >= 0 ? "+" : "-"}{money(totals.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {(!builds || builds.length === 0) ? (
        <div className="hud-panel min-h-[300px] flex flex-col items-center justify-center text-center" data-testid="status-dungeons-empty">
          <Landmark className="mb-4 h-10 w-10 text-primary/60" />
          <h3 className="text-lg">NO DUNGEONS MAPPED</h3>
          <p className="mt-2 max-w-md text-xs font-mono text-muted-foreground">
            Your first income stream becomes the first room in the guild hall. Add its revenue and operating cost to start tracking.
          </p>
          <Button onClick={openCreate} className="mt-6 hud-button" data-testid="button-empty-create-dungeon">
            <Plus className="mr-2 h-4 w-4" /> MAP FIRST DUNGEON
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2" data-testid="list-dungeons">
          {builds.map((build) => {
            const netProfit = build.netProfit ?? build.revenue - build.expenses;
            const profitable = netProfit >= 0;
            return (
              <Card key={build.id} className="group relative overflow-hidden border-primary/25 bg-primary/[0.035] transition-colors hover:border-primary/60 hover:bg-primary/[0.07]" data-testid={`card-dungeon-${build.id}`}>
                <div className="absolute right-0 top-0 h-20 w-20 border-l border-b border-primary/10 opacity-60" />
                <CardHeader className="relative pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg text-primary" data-testid={`text-dungeon-name-${build.id}`}>{build.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2 min-h-10 text-xs normal-case tracking-normal" data-testid={`text-dungeon-description-${build.id}`}>
                        {build.description}
                      </CardDescription>
                    </div>
                    <Badge className={`shrink-0 ${rankClass[build.rank]}`} data-testid={`status-dungeon-rank-${build.id}`}>
                      {build.rank}-RANK
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-3 gap-2 border-y border-primary/15 py-4">
                    <div>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><TrendingUp className="h-3 w-3 text-success" /> REVENUE</div>
                      <div className="mt-1 text-sm font-mono text-success" data-testid={`text-dungeon-revenue-${build.id}`}>{money(build.revenue)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><TrendingDown className="h-3 w-3 text-warning" /> COSTS</div>
                      <div className="mt-1 text-sm font-mono text-warning" data-testid={`text-dungeon-expenses-${build.id}`}>{money(build.expenses)}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><Coins className="h-3 w-3 text-primary" /> NET</div>
                      <div className={`mt-1 text-sm font-mono ${profitable ? "text-primary" : "text-destructive"}`} data-testid={`text-dungeon-net-profit-${build.id}`}>
                        {profitable ? "+" : "-"}{money(netProfit)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${profitable ? "text-success" : "text-destructive"}`} data-testid={`status-dungeon-profit-${build.id}`}>
                      <Shield className="h-3.5 w-3.5" /> {profitable ? "PROFITABLE RUN" : "COSTS EXCEED REVENUE"}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(build)} data-testid={`button-edit-dungeon-${build.id}`}>
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" /> EDIT
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget(build)} data-testid={`button-delete-dungeon-${build.id}`}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> DELETE
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent data-testid="dialog-dungeon-editor">
          <DialogHeader>
            <DialogTitle>{editingBuild ? "EDIT DUNGEON" : "MAP NEW DUNGEON"}</DialogTitle>
            <DialogDescription>
              {editingBuild ? "Update the source data for this income stream." : "Register a revenue stream in your personal guild hall."}
            </DialogDescription>
          </DialogHeader>
          <BuildForm build={editingBuild} onClose={() => setEditorOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-delete-dungeon">
          <DialogHeader>
            <DialogTitle>ABANDON DUNGEON?</DialogTitle>
            <DialogDescription>
              This removes <span className="text-primary">{deleteTarget?.name}</span> from your registry. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteBuild.error && (
            <div className="border border-destructive/40 bg-destructive/10 p-3 text-xs font-mono text-destructive" data-testid="status-dungeon-delete-error">
              DELETE FAILED: {String(deleteBuild.error)}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete-dungeon">
              <X className="mr-2 h-4 w-4" /> KEEP DUNGEON
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleteBuild.isPending} data-testid="button-confirm-delete-dungeon">
              <Trash2 className="mr-2 h-4 w-4" /> {deleteBuild.isPending ? "REMOVING..." : "ABANDON"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}