import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, Zap, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useSimulations, useSimulationSummaries } from "../lib/hooks";
import type { SchedulerPolicy, SimulationSummary, SimulationResult } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const POLICY_COLORS: Record<string, string> = {
  fcfs: "#64748b",
  sjf: "#3b82f6",
  priority: "#8b5cf6",
  roundrobin: "#f59e0b",
  bestfit: "#10b981",
  worstfit: "#ef4444",
  loadbalancing: "#06b6d4",
  easybackfill: "#f97316",
};

/** Batch summaries may return camelCase (Pydantic) or snake_case from ORM. */
function pickSummary(raw: unknown): SimulationResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const num = (snake: string, camel: string) => Number(o[snake] ?? o[camel] ?? 0);
  return {
    total_time: num("total_time", "totalTime"),
    total_energy_joules: num("total_energy_joules", "totalEnergyJoules"),
    jobs_total: num("jobs_total", "jobsTotal"),
    jobs_completed: num("jobs_completed", "jobsCompleted"),
    jobs_failed: num("jobs_failed", "jobsFailed"),
    avg_wait_time: num("avg_wait_time", "avgWaitTime"),
    avg_transfer_time: num("avg_transfer_time", "avgTransferTime"),
    avg_turnaround_time: num("avg_turnaround_time", "avgTurnaroundTime"),
  };
}

function PolicyRowInner({
  policy,
  summaries,
}: {
  policy: string;
  summaries: SimulationResult[];
}) {
  if (summaries.length === 0) return null;
  const avgWait = summaries.reduce((a, r) => a + r.avg_wait_time, 0) / summaries.length;
  const avgTurnaround = summaries.reduce((a, r) => a + r.avg_turnaround_time, 0) / summaries.length;
  const totalJobs = summaries.reduce((a, r) => a + r.jobs_completed, 0);

  return (
    <tr className="data-table-row">
      <td className="data-table-cell">
        <span
          className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
          style={{
            background: (POLICY_COLORS[policy] ?? "#64748b") + "22",
            color: POLICY_COLORS[policy] ?? "#94a3b8",
          }}
        >
          {policy}
        </span>
      </td>
      <td className="data-table-cell">{summaries.length}</td>
      <td className="data-table-cell">{avgWait.toFixed(1)}s</td>
      <td className="data-table-cell">{avgTurnaround.toFixed(1)}s</td>
      <td className="data-table-cell">{totalJobs}</td>
    </tr>
  );
}

function AggregatedTable({
  doneSims,
  summaryById,
}: {
  doneSims: SimulationSummary[];
  summaryById: Map<string, SimulationResult>;
}) {
  const policies = useMemo(() => Array.from(new Set(doneSims.map((s) => s.policy))), [doneSims]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="data-table-head">
          <tr>
            <th className="data-table-th">Policy</th>
            <th className="data-table-th">Runs</th>
            <th className="data-table-th">Avg Wait</th>
            <th className="data-table-th">Avg Turnaround</th>
            <th className="data-table-th">Jobs Completed</th>
          </tr>
        </thead>
        <tbody className="data-table-body">
          {policies.map((policy) => {
            const sims = doneSims.filter((s) => s.policy === policy);
            const results = sims
              .map((s) => summaryById.get(s.id))
              .filter((x): x is SimulationResult => !!x);
            return <PolicyRowInner key={policy} policy={policy} summaries={results} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function BarChartSection({
  doneSims,
  summaryById,
}: {
  doneSims: SimulationSummary[];
  summaryById: Map<string, SimulationResult>;
}) {
  const chartData = useMemo(() => {
    const policies = Array.from(new Set(doneSims.map((s) => s.policy)));
    return policies
      .map((policy) => {
        const sims = doneSims.filter((s) => s.policy === policy);
        const summaries = sims
          .map((s) => summaryById.get(s.id))
          .filter((x): x is SimulationResult => !!x);
        if (!summaries.length) return null;
        const avgWait = summaries.reduce((a, r) => a + r.avg_wait_time, 0) / summaries.length;
        const avgTurnaround =
          summaries.reduce((a, r) => a + r.avg_turnaround_time, 0) / summaries.length;
        return {
          policy,
          "Avg Wait (s)": parseFloat(avgWait.toFixed(1)),
          "Avg Turnaround (s)": parseFloat(avgTurnaround.toFixed(1)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [doneSims, summaryById]);

  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avg wait time by policy</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis unit="s" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip {...chartTooltipProps} formatter={(v: number) => `${v.toFixed(1)}s`} />
              <Bar dataKey="Avg Wait (s)" fill={chartCss.c1} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avg turnaround by policy</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis unit="s" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip {...chartTooltipProps} formatter={(v: number) => `${v.toFixed(1)}s`} />
              <Bar dataKey="Avg Turnaround (s)" fill={chartCss.c2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function ValidationInsights() {
  const { data: page, isLoading, error } = useSimulations(undefined, { limit: 2000 });
  const sims = page?.items ?? [];
  const doneSims = useMemo(() => sims.filter((s) => s.status === "done"), [sims]);
  const doneIds = useMemo(() => doneSims.map((s) => s.id), [doneSims]);
  const { data: summaryRows } = useSimulationSummaries(doneIds);

  const summaryById = useMemo(() => {
    const m = new Map<string, SimulationResult>();
    summaryRows?.forEach((row) => {
      const s = pickSummary(row.summary);
      if (s) m.set(row.id, s);
    });
    return m;
  }, [summaryRows]);

  const policies = useMemo(
    () => Array.from(new Set(doneSims.map((s) => s.policy))) as SchedulerPolicy[],
    [doneSims],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {[
          { label: "Completed runs", icon: Target, color: "blue", value: String(doneSims.length) },
          { label: "Policies tested", icon: Clock, color: "green", value: String(policies.length) },
          {
            label: "Unique clusters",
            icon: Zap,
            color: "purple",
            value: String(new Set(doneSims.map((s) => s.clusterId ?? s.cluster_id)).size),
          },
          {
            label: "Data points",
            icon: TrendingUp,
            color: "yellow",
            value: String(doneSims.length * 5),
          },
        ].map(({ label, icon: Icon, color, value }) => {
          const colors: Record<string, string> = {
            blue: "bg-primary/15 text-primary ring-1 ring-primary/20",
            green:
              "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400",
            purple:
              "bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/25 dark:text-violet-300",
            yellow:
              "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25 dark:text-amber-300",
          };
          return (
            <Card key={label} variant="default" className="gap-4">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold text-foreground">{value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading simulation data…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> Backend unreachable
        </div>
      )}

      {!isLoading && !error && doneSims.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No completed simulations yet. Run some from the Cluster Simulation tab.
        </div>
      )}

      {!isLoading && !error && doneSims.length > 0 && (
        <>
          <BarChartSection doneSims={doneSims} summaryById={summaryById} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy performance summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AggregatedTable doneSims={doneSims} summaryById={summaryById} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
