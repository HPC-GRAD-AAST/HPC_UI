import { useEffect, useMemo, useState } from "react";
import { Play, Plus, Trash2, RefreshCw, Eye, LayoutList } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useExperimentConfigs,
  useCreateExperimentConfig,
  useDeleteExperimentConfig,
  useTriggerExperimentRun,
  useExperimentRuns,
  useExperimentConfig,
  useExperimentRun,
  useClusters,
  useTraces,
  useRLModels,
} from "../lib/hooks";
import {
  SchedulerPolicy,
  isRLPolicy,
  traceJobCount,
  apiIsoDate,
  formatApiDateTime,
  experimentRunJobs,
  experimentRunNodes,
  type ExperimentRunResponse,
} from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ConfirmDangerDialog } from "./ui/confirm-danger-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const POLICIES: SchedulerPolicy[] = [
  "fcfs",
  "sjf",
  "priority",
  "roundrobin",
  "bestfit",
  "worstfit",
  "loadbalancing",
  "easybackfill",
  "rl_v2",
  "rl_backfill",
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    running: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    failed: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatMetricValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString() : String(v);
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

const SUMMARY_LABELS: Record<string, string> = {
  total_time: "Simulation time",
  total_energy_joules: "Total energy (J)",
  jobs_total: "Jobs total",
  jobs_completed: "Jobs completed",
  jobs_failed: "Jobs failed",
  avg_wait_time: "Avg wait time",
  avg_transfer_time: "Avg transfer time",
  avg_turnaround_time: "Avg turnaround time",
};

function summaryEntries(summary: ExperimentRunResponse["summary"]): [string, string][] {
  if (!summary || typeof summary !== "object") return [];
  return Object.entries(summary as Record<string, unknown>).map(([k, v]) => [
    SUMMARY_LABELS[k] ?? k.replace(/_/g, " "),
    formatMetricValue(v),
  ]);
}

function shortNodeId(id: unknown): string {
  const s = id == null ? "" : String(id);
  if (!s) return "—";
  return s.length <= 12 ? s : `${s.slice(0, 8)}…`;
}

function downsampleSnapshots<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    out.push(arr[Math.round(i * step)]!);
  }
  return out;
}

const CHART_COLORS = ["#34d399", "#38bdf8", "#fbbf24", "#a78bfa", "#fb7185", "#94a3b8"];

function ExperimentConfigDetailDialog({
  configId,
  open,
  onOpenChange,
}: {
  configId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: cfg, isLoading, error } = useExperimentConfig(open && configId ? configId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Experiment configuration</DialogTitle>
          <DialogDescription>Read-only details for this experiment definition.</DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Could not load configuration.</p>}
        {cfg && (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium text-foreground">{cfg.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Policy</dt>
              <dd className="font-mono text-foreground">{cfg.policy}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Seed</dt>
              <dd className="text-foreground">{cfg.seed}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cluster ID</dt>
              <dd className="break-all font-mono text-xs text-foreground">{cfg.cluster_id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Workload trace ID</dt>
              <dd className="break-all font-mono text-xs text-foreground">{cfg.workload_trace_id}</dd>
            </div>
            {cfg.description ? (
              <div>
                <dt className="text-muted-foreground">Description</dt>
                <dd className="text-foreground">{cfg.description}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="text-foreground">{formatApiDateTime(apiIsoDate(cfg, "created"))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="text-foreground">{formatApiDateTime(apiIsoDate(cfg, "updated"))}</dd>
            </div>
          </dl>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExperimentRunDetailDialog({
  runId,
  open,
  onOpenChange,
}: {
  runId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: run, isLoading, error, refetch } = useExperimentRun(open && runId ? runId : null);
  const [jobFilter, setJobFilter] = useState("");

  useEffect(() => {
    if (!open) setJobFilter("");
  }, [open]);

  const jobs = useMemo(() => (run ? experimentRunJobs(run) : []), [run]);
  const nodes = useMemo(() => (run ? experimentRunNodes(run) : []), [run]);
  const snaps = useMemo(() => (Array.isArray(run?.snapshots) ? run.snapshots : []), [run]);

  const filteredJobs = useMemo(() => {
    const q = jobFilter.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => String(j.id ?? "").toLowerCase().includes(q));
  }, [jobs, jobFilter]);

  const chartSnapData = useMemo(() => {
    const sample = downsampleSnapshots(snaps, 400);
    return sample.map((s) => ({
      t: s.timestamp,
      utilization: Math.round(s.cluster_utilization * 10000) / 100,
      power: s.total_power_watts,
      running: s.running_jobs,
      waiting: s.waiting_jobs,
    }));
  }, [snaps]);

  const nodeEnergyData = useMemo(
    () =>
      nodes.map((n) => ({
        name: shortNodeId(n.id),
        fullId: String(n.id ?? ""),
        energy: Number(n.consumed_energy_joules ?? n.consumedEnergyJoules ?? 0),
        jobs: Number(n.total_jobs_run ?? n.totalJobsRun ?? 0),
        cpus: Number(n.total_cpus ?? n.totalCpus ?? 0),
        mem: Number(n.total_mem ?? n.totalMem ?? 0),
        zone: String(n.zone ?? "—"),
        nodeStatus: String(n.status ?? "—"),
      })),
    [nodes],
  );

  const nodeJobsPie = useMemo(
    () =>
      nodeEnergyData.map((d, i) => ({
        name: d.name,
        value: d.jobs,
        fill: CHART_COLORS[i % CHART_COLORS.length]!,
      })),
    [nodeEnergyData],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(88vh,900px)] max-h-[min(88vh,900px)] w-[min(1400px,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-1.5rem)]">
        <DialogHeader className="shrink-0 space-y-3 border-b border-border bg-muted/20 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pe-8">
            <div>
              <DialogTitle className="text-xl">Experiment run results</DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap items-center gap-2">
                {run ? (
                  <>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">{run.id}</span>
                    <StatusBadge status={run.status} />
                    <span className="text-muted-foreground">
                      Config{" "}
                      <span className="font-mono text-foreground">
                        {run.config_id ?? run.configId ?? "—"}
                      </span>
                    </span>
                  </>
                ) : (
                  "Load a run to inspect summary, per-job and per-node metrics, and timeline charts."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading && (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
              <p className="text-sm text-muted-foreground">Loading run…</p>
            </div>
          )}
          {error && (
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-10">
              <p className="text-center text-sm text-destructive">
                Could not load run.{" "}
                <button type="button" className="underline" onClick={() => refetch()}>
                  Retry
                </button>
              </p>
            </div>
          )}

          {run && (
            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-0">
              <div className="shrink-0 border-b border-border/80 bg-muted/30 px-6 py-2.5">
                <TabsList className="flex h-auto w-full flex-wrap gap-0.5 rounded-lg bg-muted/60 p-1 sm:w-auto">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Jobs ({jobs.length})
                  </TabsTrigger>
                  <TabsTrigger value="nodes" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Nodes ({nodes.length})
                  </TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    Timeline
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="rounded-xl border border-border bg-muted/15 p-4 text-sm text-muted-foreground">
                    <span className="text-foreground">Created</span> {formatApiDateTime(apiIsoDate(run, "created"))}
                    <span className="mx-2 text-border">·</span>
                    <span className="text-foreground">Updated</span> {formatApiDateTime(apiIsoDate(run, "updated"))}
                  </div>

                  {run.summary && Object.keys(run.summary as object).length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Summary</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {summaryEntries(run.summary).map(([label, v], i) => (
                          <div
                            key={`${label}-${i}`}
                            className="rounded-xl border border-border bg-card/80 p-4 shadow-sm"
                          >
                            <div className="text-xs font-medium text-muted-foreground">{label}</div>
                            <div className="mt-2 font-mono text-lg leading-tight tabular-nums text-foreground">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No summary yet (run may still be in progress or failed).
                    </p>
                  )}

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-border p-4">
                      <h4 className="mb-1 text-sm font-medium text-foreground">Jobs overview</h4>
                      <p className="text-xs text-muted-foreground">
                        {jobs.length} job records. Open the Jobs tab for the full table.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <h4 className="mb-1 text-sm font-medium text-foreground">Nodes overview</h4>
                      <p className="text-xs text-muted-foreground">
                        {nodes.length} nodes. Charts and tables are on the Nodes tab.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="jobs" className="mt-0 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{filteredJobs.length}</span> of{" "}
                      {jobs.length} jobs
                      {jobFilter ? " (filtered)" : ""}
                    </p>
                    <label className="flex max-w-md flex-1 items-center gap-2 text-sm">
                      <span className="shrink-0 text-muted-foreground">Filter by id</span>
                      <input
                        type="search"
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        placeholder="e.g. trace-job-3"
                        className="native-field min-w-0 flex-1 py-2 text-sm"
                      />
                    </label>
                  </div>

                  {filteredJobs.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      {jobs.length === 0 ? "No job results in this run." : "No jobs match the filter."}
                    </p>
                  ) : (
                    <div className="max-h-[min(560px,58vh)] overflow-auto rounded-xl border border-border shadow-inner">
                      <table className="w-full min-w-[900px] text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur-sm">
                          <tr>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Job</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Status</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Wait</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Duration</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Total time</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Submit</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Node</th>
                            <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">Queue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredJobs.map((j, i) => (
                            <tr key={String(j.id ?? i)} className="hover:bg-muted/40">
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-foreground">
                                {String(j.id ?? "—")}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5">
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                                  {String(j.status ?? "—")}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                                {formatMetricValue(j.wait_time ?? j.waitTime)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                                {formatMetricValue(j.duration)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                                {formatMetricValue(j.total_time ?? j.totalTime)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground">
                                {formatMetricValue(j.submission_time ?? j.submissionTime)}
                              </td>
                              <td className="max-w-[140px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground" title={String(j.assigned_node ?? j.assignedNode ?? "")}>
                                {shortNodeId(j.assigned_node ?? j.assignedNode)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                                {String(j.queue ?? "—")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nodes" className="mt-0 space-y-8">
                  {nodes.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No node results in this run.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {nodeEnergyData.map((n) => (
                          <div
                            key={n.fullId}
                            className="flex flex-col rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm"
                          >
                            <div className="font-mono text-xs font-medium text-foreground" title={n.fullId}>
                              {n.fullId}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {n.zone} · {n.nodeStatus}
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <dt className="text-xs text-muted-foreground">Energy (J)</dt>
                                <dd className="font-mono tabular-nums text-foreground">{n.energy.toLocaleString()}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Jobs run</dt>
                                <dd className="font-mono tabular-nums text-foreground">{n.jobs}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">CPUs</dt>
                                <dd className="font-mono tabular-nums text-foreground">{n.cpus || "—"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Mem (MB)</dt>
                                <dd className="font-mono tabular-nums text-foreground">{n.mem || "—"}</dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-8 lg:grid-cols-2">
                        <div className="rounded-xl border border-border bg-card/50 p-4">
                          <h4 className="mb-1 text-sm font-semibold text-foreground">Energy by node</h4>
                          <p className="mb-4 text-xs text-muted-foreground">Total simulated energy draw (joules)</p>
                          <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={nodeEnergyData} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : String(v))} />
                                <Tooltip
                                  contentStyle={{ borderRadius: 8 }}
                                  formatter={(value: number) => [value.toLocaleString(), "J"]}
                                />
                                <Bar dataKey="energy" fill="#34d399" name="Energy (J)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card/50 p-4">
                          <h4 className="mb-1 text-sm font-semibold text-foreground">Jobs per node</h4>
                          <p className="mb-4 text-xs text-muted-foreground">Share of completed jobs by assigned node</p>
                          <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={nodeJobsPie}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={52}
                                  outerRadius={96}
                                  paddingAngle={2}
                                >
                                  {nodeJobsPie.map((entry, index) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => [v, "Jobs"]} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead className="border-b border-border bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Node</th>
                              <th className="px-4 py-3 font-semibold">Zone</th>
                              <th className="px-4 py-3 font-semibold">Status</th>
                              <th className="px-4 py-3 font-semibold text-end">Energy (J)</th>
                              <th className="px-4 py-3 font-semibold text-end">Jobs</th>
                              <th className="px-4 py-3 font-semibold text-end">CPUs</th>
                              <th className="px-4 py-3 font-semibold text-end">Mem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {nodeEnergyData.map((n) => (
                              <tr key={n.fullId} className="hover:bg-muted/30">
                                <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs" title={n.fullId}>
                                  {n.fullId}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{n.zone}</td>
                                <td className="px-4 py-3">{n.nodeStatus}</td>
                                <td className="px-4 py-3 text-end font-mono tabular-nums">{n.energy.toLocaleString()}</td>
                                <td className="px-4 py-3 text-end font-mono tabular-nums">{n.jobs}</td>
                                <td className="px-4 py-3 text-end tabular-nums">{n.cpus || "—"}</td>
                                <td className="px-4 py-3 text-end tabular-nums text-muted-foreground">{n.mem || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-0 space-y-8">
                  {chartSnapData.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      No snapshot time series for this run.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Charts use up to 400 downsampled points from {snaps.length} snapshots for responsiveness.
                      </p>
                      <div className="rounded-xl border border-border bg-card/50 p-4">
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Cluster utilization &amp; power</h4>
                        <p className="mb-4 text-xs text-muted-foreground">Simulation time (x) vs utilization % and total power (W)</p>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartSnapData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                              <XAxis dataKey="t" tick={{ fontSize: 10 }} tickFormatter={(v) => String(Math.round(Number(v)))} />
                              <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: "%", angle: -90, position: "insideLeft" }} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: "W", angle: 90, position: "insideRight" }} />
                              <Tooltip
                                contentStyle={{ borderRadius: 8 }}
                                labelFormatter={(t) => `t = ${t}`}
                              />
                              <Legend />
                              <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="utilization"
                                name="Utilization %"
                                fill="#34d399"
                                fillOpacity={0.25}
                                stroke="#059669"
                                strokeWidth={1}
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="power"
                                name="Power (W)"
                                stroke="#38bdf8"
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card/50 p-4">
                        <h4 className="mb-1 text-sm font-semibold text-foreground">Running vs waiting jobs</h4>
                        <p className="mb-4 text-xs text-muted-foreground">Queue depth over simulation time</p>
                        <div className="h-[260px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartSnapData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                              <XAxis dataKey="t" tick={{ fontSize: 10 }} tickFormatter={(v) => String(Math.round(Number(v)))} />
                              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                              <Tooltip contentStyle={{ borderRadius: 8 }} labelFormatter={(t) => `t = ${t}`} />
                              <Legend />
                              <Line type="monotone" dataKey="running" name="Running" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
                              <Line type="monotone" dataKey="waiting" name="Waiting" stroke="#fb7185" strokeWidth={1.5} dot={false} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-muted/10 px-6 py-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunsPanel({ configId }: { configId: string }) {
  const { data: runs, isLoading } = useExperimentRuns(configId);
  const { mutate: triggerRun, isPending } = useTriggerExperimentRun();
  const [viewRunId, setViewRunId] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-foreground">{runs?.length ?? 0} runs</span>
        <Button
          type="button"
          size="sm"
          onClick={() => triggerRun(configId)}
          disabled={isPending}
          className="shadow-[0_0_18px_-8px_var(--neon-glow)]"
        >
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run
        </Button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {(runs ?? []).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-2 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 8)}…</span>
            <StatusBadge status={run.status} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground text-end">
              {formatApiDateTime(apiIsoDate(run, "created"))}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1"
              onClick={() => setViewRunId(run.id)}
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </div>
        ))}
        {!runs?.length && !isLoading && <div className="py-2 text-sm text-muted-foreground">No runs yet</div>}
        {isLoading && <div className="py-2 text-sm text-muted-foreground">Loading runs…</div>}
      </div>

      <ExperimentRunDetailDialog runId={viewRunId} open={!!viewRunId} onOpenChange={(o) => !o && setViewRunId(null)} />
    </div>
  );
}

export function ExperimentManagement() {
  const { data: configs, isLoading: configsLoading } = useExperimentConfigs();
  const { data: clusters } = useClusters();
  const { data: traces } = useTraces();
  const { mutate: createConfig, isPending: creating } = useCreateExperimentConfig();
  const { mutate: deleteConfig, isPending: deleting } = useDeleteExperimentConfig();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewConfigId, setViewConfigId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    cluster_id: "",
    workload_trace_id: "",
    policy: "fcfs" as SchedulerPolicy,
    model_id: "",
    seed: 42,
    description: "",
  });

  const { data: rlModels } = useRLModels();
  const needsModel = isRLPolicy(form.policy);

  const traceList = traces ?? [];
  const readyTraces = traceList.filter((t) => t.status === "ready");

  const handleCreate = () => {
    if (!form.name || !form.cluster_id || !form.workload_trace_id) return;
    if (needsModel && !form.model_id) return;
    createConfig(
      {
        ...form,
        model_id: needsModel ? form.model_id : undefined,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ name: "", cluster_id: "", workload_trace_id: "", policy: "fcfs", model_id: "", seed: 42, description: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Experiments</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Configure scheduling experiments on workload traces, run them, and inspect metrics per run.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm(!showForm)} className="shrink-0">
          <Plus className="h-5 w-5" />
          New experiment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New experiment</CardTitle>
          <CardDescription>Define cluster, trace, policy, and seed — then create and expand a row to run.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {showForm && (
            <div className="border-t border-border pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="native-label">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="My experiment"
                    className="native-field"
                  />
                </div>

                <div>
                  <label className="native-label">Cluster</label>
                  <select
                    value={form.cluster_id}
                    onChange={(e) => setForm({ ...form, cluster_id: e.target.value })}
                    className="native-field"
                  >
                    <option value="">Select cluster…</option>
                    {(clusters ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.node_count} nodes)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="native-label">Workload trace</label>
                  <select
                    value={form.workload_trace_id}
                    onChange={(e) => setForm({ ...form, workload_trace_id: e.target.value })}
                    className="native-field"
                  >
                    <option value="">Select trace…</option>
                    {readyTraces.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({traceJobCount(t).toLocaleString()} jobs)
                      </option>
                    ))}
                  </select>
                  {!readyTraces.length && !traceList.length && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      No traces yet — upload one on the Traces page first.
                    </p>
                  )}
                  {!readyTraces.length && traceList.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      No trace is ready yet (still parsing or failed). Wait until parsing finishes or re-upload.
                    </p>
                  )}
                </div>

                <div>
                  <label className="native-label">Scheduling policy</label>
                  <select
                    value={form.policy}
                    onChange={(e) => setForm({ ...form, policy: e.target.value as SchedulerPolicy })}
                    className="native-field"
                  >
                    {POLICIES.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {needsModel && (
                  <div>
                    <label className="native-label">RL model</label>
                    <select
                      value={form.model_id}
                      onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                      className="native-field"
                    >
                      <option value="">Select a registered model…</option>
                      {(rlModels ?? []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.mode}/{m.variant})
                        </option>
                      ))}
                    </select>
                    {(rlModels ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No RL models registered. POST /api/v1/rl-models/scan with the models directory.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="native-label">Random seed</label>
                  <input
                    type="number"
                    value={form.seed}
                    onChange={(e) => setForm({ ...form, seed: parseInt(e.target.value, 10) })}
                    className="native-field"
                  />
                </div>

                <div>
                  <label className="native-label">Description (optional)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="native-field"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    !form.name ||
                    !form.cluster_id ||
                    !form.workload_trace_id ||
                    (needsModel && !form.model_id)
                  }
                >
                  {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Experiment configs</CardTitle>
          <CardDescription>View details, expand to run or open run results.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {configsLoading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}

          {!configsLoading && !configs?.length && (
            <div className="py-8 text-center text-muted-foreground">No experiments yet. Create one above.</div>
          )}

          <div className="space-y-3">
            {(configs ?? []).map((cfg) => (
              <div
                key={cfg.id}
                className="overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 p-4">
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer rounded-md text-start transition-colors hover:bg-muted/40"
                    onClick={() => setExpandedId(expandedId === cfg.id ? null : cfg.id)}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedId(expandedId === cfg.id ? null : cfg.id)}
                  >
                    <div className="font-medium text-foreground">{cfg.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {cfg.policy.toUpperCase()} · {formatApiDateTime(apiIsoDate(cfg, "created"))}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewConfigId(cfg.id);
                      }}
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      Config
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(cfg.id);
                      }}
                      aria-label={`Delete ${cfg.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedId === cfg.id && (
                  <div className="border-t border-border bg-muted/25 p-4">
                    <RunsPanel configId={cfg.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ExperimentConfigDetailDialog
        configId={viewConfigId}
        open={!!viewConfigId}
        onOpenChange={(o) => !o && setViewConfigId(null)}
      />

      <ConfirmDangerDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title="Delete experiment?"
        description="This removes the experiment configuration. Existing run records may become orphaned in the UI until refresh."
        confirmLabel="Delete"
        isPending={deleting}
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteConfig(pendingDeleteId, {
              onSuccess: () => setPendingDeleteId(null),
            });
          }
        }}
      />
    </div>
  );
}
