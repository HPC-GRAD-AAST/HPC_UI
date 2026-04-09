import { useState } from "react";
import { Play, FileText, Download, Plus, Trash2, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  useExperimentConfigs,
  useCreateExperimentConfig,
  useDeleteExperimentConfig,
  useTriggerExperimentRun,
  useExperimentRuns,
  useClusters,
  useTraces,
} from "../lib/hooks";
import { SchedulerPolicy } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

function RunsPanel({ configId }: { configId: string }) {
  const { data: runs, isLoading } = useExperimentRuns(configId);
  const { mutate: triggerRun, isPending } = useTriggerExperimentRun();

  if (isLoading) return <div className="py-4 text-muted-foreground">Loading runs...</div>;

  const comparisonData = (runs ?? [])
    .filter((r) => r.status === "done")
    .map((r, i) => ({ name: `Run ${i + 1}`, status: r.status, id: r.id }));

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
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {(runs ?? []).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2 text-sm transition-colors hover:bg-muted/50"
          >
            <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 8)}…</span>
            <StatusBadge status={run.status} />
            <span className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
          </div>
        ))}
        {!runs?.length && <div className="py-2 text-sm text-muted-foreground">No runs yet</div>}
      </div>
      {comparisonData.length >= 2 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium text-foreground">Completed Runs</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="id" fill="#34d399" name="Run" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function ExperimentManagement() {
  const { data: configs, isLoading: configsLoading } = useExperimentConfigs();
  const { data: clusters } = useClusters();
  const { data: traces } = useTraces();
  const { mutate: createConfig, isPending: creating } = useCreateExperimentConfig();
  const { mutate: deleteConfig } = useDeleteExperimentConfig();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    cluster_id: "",
    workload_trace_id: "",
    policy: "fcfs" as SchedulerPolicy,
    seed: 42,
    description: "",
  });

  const readyTraces = (traces ?? []).filter((t) => t.status === "ready");

  const handleCreate = () => {
    if (!form.name || !form.cluster_id || !form.workload_trace_id) return;
    createConfig(
      { ...form, description: form.description || undefined },
      { onSuccess: () => { setShowForm(false); setForm({ name: "", cluster_id: "", workload_trace_id: "", policy: "fcfs", seed: 42, description: "" }); } }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Experiments</CardTitle>
            <CardDescription>Configure and run scheduling experiments against real workload traces</CardDescription>
          </div>
          <Button type="button" onClick={() => setShowForm(!showForm)} className="shrink-0 shadow-[0_0_20px_-8px_var(--neon-glow)]">
            <Plus className="h-5 w-5" />
            New Experiment
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
        {showForm && (
          <div className="border-t border-border pt-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <option key={c.id} value={c.id}>{c.name} ({c.node_count} nodes)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="native-label">Workload Trace</label>
                <select
                  value={form.workload_trace_id}
                  onChange={(e) => setForm({ ...form, workload_trace_id: e.target.value })}
                  className="native-field"
                >
                  <option value="">Select trace…</option>
                  {readyTraces.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.job_count.toLocaleString()} jobs)</option>
                  ))}
                </select>
                {!readyTraces.length && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">No ready traces — upload one first</p>
                )}
              </div>

              <div>
                <label className="native-label">Scheduling Policy</label>
                <select
                  value={form.policy}
                  onChange={(e) => setForm({ ...form, policy: e.target.value as SchedulerPolicy })}
                  className="native-field"
                >
                  {POLICIES.map((p) => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="native-label">Random Seed</label>
                <input
                  type="number"
                  value={form.seed}
                  onChange={(e) => setForm({ ...form, seed: parseInt(e.target.value) })}
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
                disabled={creating || !form.name || !form.cluster_id || !form.workload_trace_id}
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
          <CardTitle className="text-base">Experiment Configs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
        {configsLoading && <div className="text-muted-foreground py-8 text-center">Loading…</div>}

        {!configsLoading && !configs?.length && (
          <div className="py-8 text-center text-muted-foreground">
            No experiments yet. Create one above.
          </div>
        )}

        <div className="space-y-3">
          {(configs ?? []).map((cfg) => (
            <div key={cfg.id} className="overflow-hidden rounded-lg border border-border transition-shadow hover:shadow-md">
              <div
                className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/40"
                onClick={() => setExpandedId(expandedId === cfg.id ? null : cfg.id)}
                onKeyDown={(e) => e.key === "Enter" && setExpandedId(expandedId === cfg.id ? null : cfg.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium text-foreground">{cfg.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {cfg.policy.toUpperCase()} · {new Date(cfg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConfig(cfg.id);
                    }}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
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
    </div>
  );
}
