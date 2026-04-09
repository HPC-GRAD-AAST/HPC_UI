import { useMemo, useState } from "react";
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
import { FlaskConical, Play, AlertCircle } from "lucide-react";
import { traceJobCount } from "../lib/api";
import { useClusters, useTraces, useBenchmarkRun } from "../lib/hooks";
import { chartCss, chartGridProps, chartTooltipProps } from "../lib/chart-theme";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";

const DEFAULT_POLICIES = ["fcfs", "sjf", "easybackfill", "loadbalancing"];

export function BenchmarkLab() {
  const { data: clusters } = useClusters();
  const { data: traces } = useTraces();
  const { mutate: runBench, isPending, data: result, error, reset } = useBenchmarkRun();

  const [clusterId, setClusterId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [policiesStr, setPoliciesStr] = useState(DEFAULT_POLICIES.join(", "));
  const [nIters, setNIters] = useState(5);
  const [seqLen, setSeqLen] = useState(256);

  const readyTraces = useMemo(() => (traces ?? []).filter((t) => t.status === "ready"), [traces]);

  const chartRows = useMemo(() => {
    if (!result?.policies?.length) return [];
    return result.policies.map((p) => {
      const runs = p.runs ?? [];
      if (!runs.length) return { policy: p.policy, avgWait: 0, avgBsd: 0 };
      const avgWait = runs.reduce((a, r) => a + r.avgWaitTime, 0) / runs.length;
      const avgBsd = runs.reduce((a, r) => a + r.boundedSlowdown, 0) / runs.length;
      return { policy: p.policy, avgWait: +avgWait.toFixed(2), avgBsd: +avgBsd.toFixed(3) };
    });
  }, [result]);

  const handleRun = () => {
    if (!clusterId || !traceId) {
      toast.error("Select cluster and a ready trace.");
      return;
    }
    const policies = policiesStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    reset();
    runBench(
      {
        cluster_id: clusterId,
        workload_trace_id: traceId,
        policies,
        n_iters: nIters,
        seq_len: seqLen,
        metrics_interval: 120,
      },
      {
        onSuccess: () => toast.success("Benchmark finished"),
        onError: () => toast.error("Benchmark failed — check backend logs / caps."),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-primary" />
            Simulator benchmark
          </CardTitle>
          <CardDescription>
            Runs the same <code className="text-xs">run_simulation</code> core as live jobs, over sliding windows of a
            <strong> ready </strong>
            SWF trace. Bounded (iters ≤ 20, seq_len ≤ 2048 on the server).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="native-label">Cluster</label>
              <select
                className="native-field"
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
              >
                <option value="">Select…</option>
                {(clusters ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="native-label">Workload trace (ready)</label>
              <select className="native-field" value={traceId} onChange={(e) => setTraceId(e.target.value)}>
                <option value="">Select…</option>
                {readyTraces.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({traceJobCount(t).toLocaleString()} jobs)
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="native-label">Policies (comma-separated)</label>
              <input
                className="native-field"
                value={policiesStr}
                onChange={(e) => setPoliciesStr(e.target.value)}
              />
            </div>
            <div>
              <label className="native-label">Iterations</label>
              <input
                type="number"
                min={1}
                max={20}
                className="native-field"
                value={nIters}
                onChange={(e) => setNIters(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="native-label">Window size (jobs)</label>
              <input
                type="number"
                min={8}
                max={2048}
                className="native-field"
                value={seqLen}
                onChange={(e) => setSeqLen(Number(e.target.value))}
              />
            </div>
          </div>
          <Button type="button" onClick={handleRun} disabled={isPending}>
            <Play className="size-4" />
            Run benchmark
          </Button>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              Request failed
            </div>
          )}
          {result?.warnings?.length ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">{result.warnings.join(" ")}</p>
          ) : null}
        </CardContent>
      </Card>

      {chartRows.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avg wait by policy</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartRows}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip {...chartTooltipProps} />
                  <Legend />
                  <Bar dataKey="avgWait" name="Avg wait (s)" fill={chartCss.c1} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bounded slowdown by policy</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartRows}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="policy" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip {...chartTooltipProps} />
                  <Legend />
                  <Bar dataKey="avgBsd" name="Avg BSD" fill={chartCss.c2} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
