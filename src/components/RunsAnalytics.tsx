import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart2, RefreshCw, AlertCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DataTable, DataTableColumnHeader } from "./ui/data-table";
import { EmptyState } from "./ui/empty-state";
import { useDeleteSimulation, useSimulations } from "../lib/hooks";
import type { SchedulerPolicy, SimulationSummary } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { SimulationTableFilters } from "./simulation/simulation-table-filters";
import {
  SimulationDeleteButton,
  SimulationJobsCell,
  SimulationPolicyBadge,
  SimulationStatusBadge,
  SimulationTurnaroundCell,
  SimulationWaitCell,
} from "./simulation/simulation-table-cells";

const POLICY_LABELS: Record<SchedulerPolicy, string> = {
  fcfs: "FCFS",
  sjf: "SJF",
  priority: "Priority",
  roundrobin: "Round Robin",
  bestfit: "Best Fit",
  worstfit: "Worst Fit",
  loadbalancing: "Load Balance",
  easybackfill: "EASY Backfill",
  rl: "RL (PPO)",
};

export function RunsAnalytics() {
  const { data: simPage, isLoading, error } = useSimulations(undefined, { limit: 2000 });
  const sims = simPage?.items ?? [];
  const { mutate: deleteSim } = useDeleteSimulation();

  const doneSims = useMemo(() => sims.filter((s) => s.status === "done"), [sims]);

  const chartData = useMemo(
    () =>
      (Object.keys(POLICY_LABELS) as SchedulerPolicy[])
        .map((p) => ({ policy: POLICY_LABELS[p], count: doneSims.filter((s) => s.policy === p).length }))
        .filter((d) => d.count > 0),
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Runs & Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All simulation runs with per-row metrics and a policy breakdown chart.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Could not reach backend. Make sure the API is running.
        </div>
      )}

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

      {!isLoading && chartData.length === 0 && sims.length === 0 && (
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
            sims.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No simulations yet"
                description="Launch one from the Cluster Simulation tab."
              />
            ) : (
              <DataTable
                columns={columns}
                data={sims}
                emptyMessage="No simulations."
                globalFilterPlaceholder="Search ID, policy, status…"
                filterBar={(t) => <SimulationTableFilters table={t} />}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
