import { useState } from "react";
import { Play, RotateCcw, Cpu, MemoryStick, Server, RefreshCw, SlidersHorizontal, LineChart, Link2, AlertTriangle, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
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
  usePolicies,
  useRLModels,
  useSimulation,
  useSimulationSnapshots,
} from "../lib/hooks";
import { isRLPolicy, type SchedulerPolicy, type JobSummary } from "../lib/api";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";


function JobPickerCard({
  jobs,
  jobsLoading,
  selectedJobIds,
  setSelectedJobIds,
  toggleJob,
}: {
  jobs: JobSummary[];
  jobsLoading: boolean;
  selectedJobIds: string[];
  setSelectedJobIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleJob: (id: string) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  const standaloneJobs = jobs.filter((j) => !j.groupId);
  const groupedJobs = jobs.filter((j) => !!j.groupId);
  const groups = Object.values(
    groupedJobs.reduce<Record<string, { id: string; name: string; jobs: JobSummary[] }>>((acc, j) => {
      const key = j.groupId!;
      if (!acc[key]) acc[key] = { id: key, name: j.groupName ?? key, jobs: [] };
      acc[key].jobs.push(j);
      return acc;
    }, {}),
  );

  const missingDeps = jobs
    .filter((j) => selectedJobIds.includes(j.id))
    .flatMap((j) => (j.dependencies ?? []).filter((depId) => !selectedJobIds.includes(depId)));
  const missingDepNames = [...new Set(missingDeps)].map(
    (id) => jobMap[id]?.name ?? id.slice(0, 8) + "…",
  );

  const toggleGroup = (groupId: string) =>
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const selectGroup = (groupJobs: JobSummary[]) => {
    const ids = groupJobs.map((j) => j.id);
    const allSelected = ids.every((id) => selectedJobIds.includes(id));
    if (allSelected) {
      setSelectedJobIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedJobIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const renderJobRow = (job: JobSummary, indent = false) => {
    const deps = job.dependencies ?? [];
    const isSelected = selectedJobIds.includes(job.id);
    const missingSelected = deps.some((id) => !selectedJobIds.includes(id));

    return (
      <label
        key={job.id}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${indent ? "ml-4" : ""} ${
          isSelected && missingSelected
            ? "border-amber-500/40 bg-amber-500/5"
            : isSelected
            ? "border-primary/50 bg-primary/10 shadow-[0_0_16px_-10px_var(--neon-glow)]"
            : "border-border hover:border-primary/25 hover:bg-muted/50"
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleJob(job.id)}
          className="accent-primary mt-0.5 rounded border-input"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{job.name}</span>
            {isSelected && missingSelected && (
              <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                required job not selected
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {job.cpuReq} CPU · {job.memReq} MB · {job.duration}s · {job.priority}
          </div>
          {deps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <Link2 className="h-3 w-3 text-sky-500" />
              <span className="text-muted-foreground">Runs after:</span>
              {deps.map((depId, i) => {
                const depSelected = selectedJobIds.includes(depId);
                const depName = jobMap[depId]?.name ?? depId.slice(0, 8) + "…";
                return (
                  <span
                    key={depId}
                    className={`font-medium ${depSelected ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                  >
                    {depName}{i < deps.length - 1 ? "," : ""}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </label>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select jobs ({selectedJobIds.length} selected)</CardTitle>
        <CardDescription>
          Standalone tasks and workflow groups — expand a workflow to see its tasks and dependencies.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {jobsLoading && <JobPickerSkeleton />}
        {!jobsLoading && !jobs.length && (
          <EmptyState
            icon={Server}
            title="No jobs found"
            description="Submit jobs from the Job Submission tab, then return here to attach them to a run."
          />
        )}
        {!jobsLoading && jobs.length > 0 && (
          <>
            {missingDepNames.length > 0 && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-medium">Warning: </span>
                  {missingDepNames.join(", ")} {missingDepNames.length === 1 ? "is" : "are"} required by
                  selected jobs but not included — those jobs will get stuck waiting.
                </div>
              </div>
            )}

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {/* Workflow groups */}
              {groups.map((group) => {
                const isOpen = !!openGroups[group.id];
                const groupIds = group.jobs.map((j) => j.id);
                const selectedCount = groupIds.filter((id) => selectedJobIds.includes(id)).length;
                const allSelected = selectedCount === groupIds.length;
                const hasWarning = group.jobs.some(
                  (j) =>
                    selectedJobIds.includes(j.id) &&
                    (j.dependencies ?? []).some((d) => !selectedJobIds.includes(d)),
                );

                return (
                  <div key={group.id} className="overflow-hidden rounded-lg border border-border">
                    {/* Group header */}
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate text-sm font-medium text-foreground">{group.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {group.jobs.length} tasks
                        </span>
                        {hasWarning && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {selectedCount}/{groupIds.length} selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => selectGroup(group.jobs)}
                          className="text-xs text-primary hover:underline"
                        >
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                    </div>

                    {/* Group tasks */}
                    {isOpen && (
                      <div className="space-y-2 p-2">
                        {group.jobs.map((job) => renderJobRow(job))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Standalone jobs */}
              {standaloneJobs.length > 0 && (
                <div>
                  {groups.length > 0 && (
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Standalone tasks</p>
                  )}
                  <div className="space-y-2">
                    {standaloneJobs.map((job) => renderJobRow(job))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedJobIds(jobs.map((j) => j.id))}
                className="text-sm font-medium text-primary hover:underline"
              >
                Select all
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={() => setSelectedJobIds([])}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SimulationResultPanel({ simId }: { simId: string }) {
  const { data: sim } = useSimulation(simId);
  const { data: snapshotsData } = useSimulationSnapshots(sim?.status === "done" ? simId : null);
  const [resultTab, setResultTab] = useState<"charts" | "jobs">("charts");

  if (!sim) return null;

  const snapshots = snapshotsData?.snapshots ?? [];
  const chartData = snapshots.map((s) => ({
    time: `${Math.round(s.timestamp / 60)}m`,
    utilization: +(s.cluster_utilization * 100).toFixed(1),
    memory: +(((s.memory_utilization ?? 0) * 100).toFixed(1)),
    running: s.running_jobs,
    waiting: s.waiting_jobs,
  }));

  const jobResults: any[] = (sim as any).jobResults ?? (sim as any).job_results ?? [];

  const shortNode = (id: string | null | undefined) => {
    if (!id) return "—";
    return id.length > 8 ? id.slice(0, 8) + "…" : id;
  };

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

      {sim.status === "done" && (
        <Tabs value={resultTab} onValueChange={setResultTab as (v: string) => void}>
          <TabsList className="w-fit">
            <TabsTrigger value="charts" className="gap-2">
              <LineChart className="size-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Server className="size-4" />
              Jobs ({jobResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-4 space-y-6">
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cluster utilization (CPU &amp; RAM)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartCss.c1} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={chartCss.c1} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="memFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartCss.c2} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={chartCss.c2} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <Tooltip {...chartTooltipProps} />
                        <Legend />
                        <Area type="monotone" dataKey="utilization" stroke={chartCss.c1} fill="url(#utilFill)" name="CPU %" />
                        <Area type="monotone" dataKey="memory" stroke={chartCss.c2} fill="url(#memFill)" name="RAM %" />
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
                        <Area type="monotone" dataKey="running" stroke={chartCss.c1} fill={chartCss.c1} fillOpacity={0.25} name="Running" stackId="1" />
                        <Area type="monotone" dataKey="waiting" stroke={chartCss.c4} fill={chartCss.c4} fillOpacity={0.2} name="Waiting" stackId="1" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <EmptyState
                icon={LineChart}
                title="No time-series snapshots"
                description="This run finished but no snapshot series was returned. Try another cluster or job set."
                className="border border-dashed border-border bg-muted/20"
              />
            )}
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            {jobResults.length === 0 ? (
              <EmptyState
                icon={Server}
                title="No job results"
                description="Job placement data will appear here after the simulation completes."
                className="border border-dashed border-border bg-muted/20"
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">Job ID</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                      <th className="px-3 py-2.5 font-medium">Assigned Node</th>
                      <th className="px-3 py-2.5 font-medium">Wait (s)</th>
                      <th className="px-3 py-2.5 font-medium">Duration (s)</th>
                      <th className="px-3 py-2.5 font-medium">Total (s)</th>
                      <th className="px-3 py-2.5 font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jobResults.map((j: any, i: number) => (
                      <tr key={j.id ?? i} className="hover:bg-muted/40">
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-foreground">
                          {String(j.id ?? "—").slice(0, 8)}…
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                            j.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : j.status === "FAILED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {j.status ?? "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-primary">
                          {shortNode(j.assigned_node ?? j.assignedNode)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{(j.wait_time ?? j.waitTime ?? 0).toFixed(1)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{(j.duration ?? 0).toFixed(1)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{(j.total_time ?? j.totalTime ?? 0).toFixed(1)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{j.priority ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
  const { data: policies } = usePolicies();
  const { data: rlModels } = useRLModels();
  const { data: jobsPage, isLoading: jobsLoading } = useJobs({ limit: 2000 });
  const jobs = jobsPage?.items ?? [];
  const { mutate: createSim, isPending: launching } = useCreateSimulation();

  const [selectedClusterId, setSelectedClusterId] = useState<string>("");
  const [selectedPolicy, setSelectedPolicy] = useState<SchedulerPolicy>("fcfs");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [seed, setSeed] = useState(42);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [tab, setTab] = useState<"setup" | "results">("setup");

  const needsModel = isRLPolicy(selectedPolicy);

  const selectedCluster = (clusters ?? []).find((c) => c.id === selectedClusterId);

  const toggleJob = (id: string) =>
    setSelectedJobIds((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]));

  const handleLaunch = () => {
    if (!selectedClusterId || selectedJobIds.length === 0) return;
    if (needsModel && !selectedModelId) return;
    createSim(
      {
        cluster_id: selectedClusterId,
        job_ids: selectedJobIds,
        policy: selectedPolicy,
        seed,
        model_id: needsModel ? selectedModelId : undefined,
      },
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

  const handleTabChange = (v: string) => setTab(v as "setup" | "results");

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="gap-6">
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
                disabled={launching || !selectedClusterId || selectedJobIds.length === 0 || (needsModel && !selectedModelId)}
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
                  {(policies ?? []).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
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

              {selectedPolicy === "rl" && (
                <div className="md:col-span-3">
                  <label className="native-label">RL model (PPO)</label>
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Using model from <span className="font-mono text-foreground">HPC_RL_MODEL_PATH</span> environment variable set on the API worker.
                  </div>
                </div>
              )}

              {needsModel && (
                <div className="md:col-span-3">
                  <label className="native-label">RL model</label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="native-field"
                  >
                    <option value="">Select a registered model…</option>
                    {(rlModels ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.mode} / {m.variant})
                      </option>
                    ))}
                  </select>
                  {(rlModels ?? []).length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No RL models registered. Use POST /api/v1/rl-models/scan to register one.
                    </p>
                  )}
                </div>
              )}
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

        <JobPickerCard
          jobs={jobs ?? []}
          jobsLoading={jobsLoading}
          selectedJobIds={selectedJobIds}
          setSelectedJobIds={setSelectedJobIds}
          toggleJob={toggleJob}
        />
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
