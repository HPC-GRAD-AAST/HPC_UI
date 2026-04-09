import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Activity, Clock, Zap, Server, AlertCircle, LayoutGrid, Table2 } from "lucide-react";
import { useDeleteSimulation, useSimulations } from "../lib/hooks";
import type { SimulationSummary } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DataTable, DataTableColumnHeader } from "./ui/data-table";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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

function MetricCard({
  label,
  value,
  icon: Icon,
  tint,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  tint: "primary" | "emerald" | "amber" | "violet";
  sub?: string;
}) {
  const tintCls: Record<string, string> = {
    primary: "bg-primary/12 text-primary ring-primary/25",
    emerald: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
    amber: "bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:text-amber-300",
    violet: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  };
  return (
    <Card variant="default" className="gap-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold text-foreground">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-3 ring-1 ${tintCls[tint]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { data: simPage, isLoading, error } = useSimulations(undefined, { limit: 2000 });
  const sims = simPage?.items ?? [];
  const { mutate: deleteSim } = useDeleteSimulation();
  const [tab, setTab] = useState("overview");

  const doneSims = useMemo(() => (sims ?? []).filter((s) => s.status === "done"), [sims]);

  const policyGroups = useMemo(() => {
    const map: Record<string, number> = {};
    (sims ?? []).forEach((s) => {
      map[s.policy] = (map[s.policy] ?? 0) + 1;
    });
    return Object.entries(map).map(([policy, count]) => ({ policy, count }));
  }, [sims]);

  const statusGroups = useMemo(() => {
    const map: Record<string, number> = {};
    (sims ?? []).forEach((s) => {
      map[s.status] = (map[s.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [sims]);

  const totalSims = sims?.length ?? 0;
  const running = (sims ?? []).filter((s) => s.status === "running").length;
  const failed = (sims ?? []).filter((s) => s.status === "failed").length;

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
        id: "jobs",
        header: "Jobs",
        enableSorting: false,
        cell: ({ row }) => <SimulationJobsCell simId={row.original.id} />,
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
        id: "energy",
        header: "Energy",
        enableSorting: false,
        cell: ({ row }) => <SimulationEnergyCell simId={row.original.id} />,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <SimulationStatusBadge status={row.original.status} />,
        filterFn: (row, columnId, filterValue) =>
          filterValue == null || filterValue === "" || filterValue === "all" || row.getValue(columnId) === filterValue,
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

      {isLoading && <OverviewSkeleton />}

      {!isLoading && !error && (
        <Tabs value={tab} onValueChange={setTab} className="gap-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-fit">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutGrid className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="size-4" />
              All simulations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Simulations" value={String(totalSims)} icon={Activity} tint="primary" />
              <MetricCard label="Completed" value={String(doneSims.length)} icon={Clock} tint="emerald" />
              <MetricCard label="Running" value={String(running)} icon={Zap} tint="violet" sub="Celery tasks active" />
              <MetricCard label="Failed" value={String(failed)} icon={AlertCircle} tint="amber" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Simulations by Policy</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {policyGroups.length === 0 ? (
                    <EmptyState
                      icon={Server}
                      title="No policy data yet"
                      description="Run simulations from the Simulation tab to populate this chart."
                      className="border-none bg-transparent py-8"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={policyGroups}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <Tooltip {...chartTooltipProps} />
                        <Bar dataKey="count" fill={chartCss.c1} name="Simulations" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {statusGroups.length === 0 ? (
                    <EmptyState
                      icon={Activity}
                      title="No status data yet"
                      description="Simulation statuses will appear here once you have runs in flight or completed."
                      className="border-none bg-transparent py-8"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={statusGroups}>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <Tooltip {...chartTooltipProps} />
                        <Bar dataKey="count" fill={chartCss.c2} name="Count" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Simulations</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {(sims ?? []).length === 0 ? (
                  <EmptyState
                    icon={Server}
                    title="No simulations yet"
                    description="Launch a run from the Cluster Simulation tab. Completed and in-progress jobs will show up in this sortable table."
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
