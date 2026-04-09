import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Settings, Brain, BarChart2, RefreshCw, AlertCircle, BookOpen, Table2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DataTable, DataTableColumnHeader } from "./ui/data-table";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useDeleteSimulation, useSimulations } from "../lib/hooks";
import type { SchedulerPolicy, SimulationSummary } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { SimulationTableFilters } from "./simulation/simulation-table-filters";
import {
  SimulationDeleteButton,
  SimulationEnergyCell,
  SimulationJobsCell,
  SimulationPolicyBadge,
  SimulationStatusBadge,
  SimulationTurnaroundCell,
  SimulationWaitCell,
} from "./simulation/simulation-table-cells";

const POLICIES: { value: SchedulerPolicy; label: string; desc: string; icon: typeof Settings }[] = [
  { value: "fcfs", label: "FCFS", desc: "First Come First Served — simple FIFO queue", icon: Settings },
  { value: "sjf", label: "SJF", desc: "Shortest Job First — minimises average wait time", icon: Settings },
  { value: "priority", label: "Priority", desc: "Priority-based scheduling — urgent jobs first", icon: Settings },
  { value: "roundrobin", label: "Round Robin", desc: "Time-sliced fair-share scheduling", icon: Settings },
  { value: "bestfit", label: "Best Fit", desc: "Packs jobs into the tightest fitting node", icon: Settings },
  { value: "worstfit", label: "Worst Fit", desc: "Spreads jobs to the most available node", icon: Settings },
  { value: "loadbalancing", label: "Load Balance", desc: "Distributes load evenly across all nodes", icon: Settings },
  { value: "easybackfill", label: "EASY Backfill", desc: "Backfills small jobs without delaying the head-of-queue job", icon: Brain },
  {
    value: "rl",
    label: "RL (PPO)",
    desc: "Learned policy from Stable-Baselines3 — set HPC_RL_MODEL_PATH on the API worker",
    icon: Brain,
  },
];

function PoliciesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

export function SchedulerControls() {
  const { data: simPage, isLoading, error } = useSimulations(undefined, { limit: 2000 });
  const sims = simPage?.items ?? [];
  const { mutate: deleteSim } = useDeleteSimulation();
  const [selected, setSelected] = useState<SchedulerPolicy | null>(null);
  const [tab, setTab] = useState("policies");

  const doneSims = useMemo(() => (sims ?? []).filter((s) => s.status === "done"), [sims]);

  const chartData = useMemo(
    () =>
      POLICIES.map((p) => {
        const matching = doneSims.filter((s) => s.policy === p.value);
        return { policy: p.label, count: matching.length };
      }).filter((d) => d.count > 0),
    [doneSims],
  );

  const columns = useMemo<ColumnDef<SimulationSummary>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 10)}…</span>
        ),
        sortingFn: (a, b) => a.original.id.localeCompare(b.original.id),
      },
      {
        accessorKey: "policy",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Policy" />,
        cell: ({ row }) => <SimulationPolicyBadge policy={row.original.policy} />,
        filterFn: (row, columnId, filterValue) =>
          filterValue == null || filterValue === "" || filterValue === "all" || row.getValue(columnId) === filterValue,
      },
      {
        id: "wait",
        header: "Avg wait",
        enableSorting: false,
        cell: ({ row }) => <SimulationWaitCell simId={row.original.id} />,
      },
      {
        id: "turnaround",
        header: "Avg turnaround",
        enableSorting: false,
        cell: ({ row }) => <SimulationTurnaroundCell simId={row.original.id} />,
      },
      {
        id: "jobs",
        header: "Jobs",
        enableSorting: false,
        cell: ({ row }) => <SimulationJobsCell simId={row.original.id} />,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <SimulationStatusBadge status={row.original.status} />,
        filterFn: (row, columnId, filterValue) =>
          filterValue == null || filterValue === "" || filterValue === "all" || row.getValue(columnId) === filterValue,
      },
      {
        id: "energy",
        header: "Energy",
        enableSorting: false,
        cell: ({ row }) => <SimulationEnergyCell simId={row.original.id} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <SimulationDeleteButton simId={row.original.id} onDelete={(id) => deleteSim(id)} />
        ),
      },
    ],
    [deleteSim],
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Could not reach backend. Make sure the API is running.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-fit">
          <TabsTrigger value="policies" className="gap-2">
            <BookOpen className="size-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="runs" className="gap-2">
            <Table2 className="size-4" />
            Runs & analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling policies</CardTitle>
              <CardDescription>
                Reference for supported policies. Choose one in Cluster Simulation when you launch a run.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <PoliciesSkeleton />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {POLICIES.map((p) => {
                    const Icon = p.icon;
                    const count = doneSims.filter((s) => s.policy === p.value).length;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setSelected(selected === p.value ? null : p.value)}
                        className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                          selected === p.value
                            ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--neon-glow)]"
                            : "border-border bg-card hover:border-primary/35 hover:bg-muted/30"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="rounded-lg bg-muted p-2 ring-1 ring-border">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          {count > 0 && (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              {count} runs
                            </span>
                          )}
                        </div>
                        <div className="mb-1 text-sm font-semibold text-foreground">{p.label}</div>
                        <div className="text-xs leading-relaxed text-muted-foreground">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs" className="mt-0 space-y-6">
          {!isLoading && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completed runs by policy</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid {...chartGridProps} />
                    <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip {...chartTooltipProps} />
                    <Legend />
                    <Bar dataKey="count" fill={chartCss.c1} name="Completed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {!isLoading && chartData.length === 0 && (sims ?? []).length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={BarChart2}
                  title="No run history yet"
                  description="Complete at least one simulation to see policy breakdown charts here."
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">All simulation runs</CardTitle>
              <CardDescription>Sort by ID, policy, or status. Metrics load per row.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading simulations…
                </div>
              )}
              {!isLoading && !error && (
                <>
                  {(sims ?? []).length === 0 ? (
                    <EmptyState
                      icon={BarChart2}
                      title="No simulations yet"
                      description="Launch one from the Cluster Simulation tab. Rows support column sorting."
                    />
                  ) : (
                    <DataTable
                      columns={columns}
                      data={sims ?? []}
                      emptyMessage="No simulations."
                      globalFilterPlaceholder="Search ID, policy, status…"
                      filterBar={(t) => <SimulationTableFilters table={t} />}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
