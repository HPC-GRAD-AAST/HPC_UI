import { useState } from "react";
import { Play, RotateCcw, Cpu, MemoryStick, Server, RefreshCw, SlidersHorizontal, LineChart } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useClusters,
  useJobs,
  useCreateSimulation,
  useSimulation,
  useSimulationSnapshots,
} from "../lib/hooks";
import type { SchedulerPolicy } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
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
];

function SimulationResultPanel({ simId }: { simId: string }) {
  const { data: sim } = useSimulation(simId);
  const { data: snapshotsData } = useSimulationSnapshots(sim?.status === "done" ? simId : null);

  if (!sim) return null;

  const snapshots = snapshotsData?.snapshots ?? [];
  const chartData = snapshots.map((s) => ({
    time: `${Math.round(s.timestamp / 60)}m`,
    utilization: +(s.cluster_utilization * 100).toFixed(1),
    running: s.running_jobs,
    waiting: s.waiting_jobs,
    power: +s.total_power_watts.toFixed(0),
  }));

  return (
    <div className="space-y-6">
      {sim.status === "running" || sim.status === "pending" ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-4 text-primary">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="font-medium">Simulation {sim.status}… polling for updates</span>
        </div>
      ) : sim.status === "failed" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          Simulation failed.
        </div>
      ) : null}

      {sim.summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total time", value: `${sim.summary.total_time.toFixed(0)}s` },
            { label: "Jobs completed", value: `${sim.summary.jobs_completed} / ${sim.summary.jobs_total}` },
            { label: "Avg wait", value: `${sim.summary.avg_wait_time.toFixed(1)}s` },
            { label: "Avg turnaround", value: `${sim.summary.avg_turnaround_time.toFixed(1)}s` },
          ].map((stat) => (
            <Card key={stat.label} variant="inset" className="gap-0 shadow-none">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-1 font-semibold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cluster utilization</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartCss.c1} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartCss.c1} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip {...chartTooltipProps} />
                  <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke={chartCss.c1}
                    fill="url(#utilFill)"
                    name="Utilization %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Running vs waiting jobs</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip {...chartTooltipProps} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="running"
                    stroke={chartCss.c1}
                    fill={chartCss.c1}
                    fillOpacity={0.25}
                    name="Running"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="waiting"
                    stroke={chartCss.c4}
                    fill={chartCss.c4}
                    fillOpacity={0.2}
                    name="Waiting"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {sim.status === "done" && chartData.length === 0 && (
        <EmptyState
          icon={LineChart}
          title="No time-series snapshots"
          description="This run finished but no snapshot series was returned. Try another cluster or job set."
          className="border border-dashed border-border bg-muted/20"
        />
      )}
    </div>
  );
}

function JobPickerSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ClusterSimulation() {
  const { data: clusters, isLoading: clustersLoading } = useClusters();
  const { data: jobsPage, isLoading: jobsLoading } = useJobs({ limit: 2000 });
  const jobs = jobsPage?.items ?? [];
  const { mutate: createSim, isPending: launching } = useCreateSimulation();

  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [selectedPolicy, setSelectedPolicy] = useState<SchedulerPolicy>("fcfs");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [seed, setSeed] = useState(42);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [tab, setTab] = useState<"setup" | "results">("setup");

  const selectedCluster = (clusters ?? []).find((c) => c.id === selectedClusterId);

  const toggleJob = (id: string) =>
    setSelectedJobIds((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]));

  const handleLaunch = () => {
    if (!selectedClusterId || selectedJobIds.length === 0) return;
    createSim(
      { cluster_id: selectedClusterId, job_ids: selectedJobIds, policy: selectedPolicy, seed },
      {
        onSuccess: (sim) => {
          setActiveSimId(sim.id);
          setTab("results");
        },
      },
    );
  };

  const handleReset = () => {
    setActiveSimId(null);
    setSelectedJobIds([]);
    setTab("setup");
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "setup" | "results")} className="gap-6">
      <TabsList className="grid w-full max-w-md grid-cols-2 sm:w-fit">
        <TabsTrigger value="setup" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Setup
        </TabsTrigger>
        <TabsTrigger value="results" className="gap-2" disabled={!activeSimId}>
          <LineChart className="size-4" />
          Results
        </TabsTrigger>
      </TabsList>

      <TabsContent value="setup" className="mt-0 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>Simulation setup</CardTitle>
              <CardDescription>Select cluster, jobs, and policy, then launch</CardDescription>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button
                type="button"
                onClick={handleLaunch}
                disabled={launching || !selectedClusterId || selectedJobIds.length === 0}
                className="shadow-[0_0_24px_-8px_var(--neon-glow)]"
              >
                {launching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Launch
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="native-label">Cluster</label>
                <select
                  value={selectedClusterId}
                  onChange={(e) => setSelectedClusterId(e.target.value)}
                  className="native-field"
                >
                  <option value="">{clustersLoading ? "Loading…" : "Select cluster…"}</option>
                  {(clusters ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.node_count} nodes)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="native-label">Scheduling policy</label>
                <select
                  value={selectedPolicy}
                  onChange={(e) => setSelectedPolicy(e.target.value as SchedulerPolicy)}
                  className="native-field"
                >
                  {POLICIES.map((p) => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="native-label">Random seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value, 10))}
                  className="native-field"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCluster && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cluster: {selectedCluster.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {(selectedCluster as { nodes?: { id: string; total_cpus: number; total_mem: number; zone: string }[] })
                  .nodes?.map((node) => {
                    const cpuPct = 0;
                    const memPct = 0;
                    return (
                      <div
                        key={node.id}
                        className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/25"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Server className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{node.id.slice(0, 8)}</span>
                        </div>
                        <div className="mb-2">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Cpu className="h-3 w-3" /> CPU
                            </span>
                            <span>{node.total_cpus} cores</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${cpuPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MemoryStick className="h-3 w-3" /> RAM
                            </span>
                            <span>{(node.total_mem / 1024).toFixed(0)} GB</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                              style={{ width: `${memPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{node.zone}</div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select jobs ({selectedJobIds.length} selected)</CardTitle>
            <CardDescription>Only persisted jobs from Job Submission appear here</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {jobsLoading && <JobPickerSkeleton />}
            {!jobsLoading && !jobs?.length && (
              <EmptyState
                icon={Server}
                title="No jobs found"
                description="Submit jobs from the Job Submission tab, then return here to attach them to a run."
              />
            )}
            {!jobsLoading && (jobs ?? []).length > 0 && (
              <>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {(jobs ?? []).map((job) => (
                    <label
                      key={job.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                        selectedJobIds.includes(job.id)
                          ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_-10px_var(--neon-glow)]"
                          : "border-border hover:border-primary/25 hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedJobIds.includes(job.id)}
                        onChange={() => toggleJob(job.id)}
                        className="accent-primary rounded border-input"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{job.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.cpu_req} CPU · {job.mem_req} MB · {job.duration}s · {job.priority}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobIds((jobs ?? []).map((j) => j.id))}
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedJobIds([])}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="results" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulation results</CardTitle>
            <CardDescription>Live status, summary metrics, and charts when snapshots exist</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {activeSimId ? (
              <SimulationResultPanel simId={activeSimId} />
            ) : (
              <EmptyState
                icon={LineChart}
                title="No active run"
                description="Launch a simulation from the Setup tab. You will land here automatically when a run starts."
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
