import { useState } from "react";
import { GitCompare, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useExperimentConfigs, useExperimentRuns, useExperimentRun } from "../lib/hooks";
import { ExperimentConfigSummary, SimulationResult } from "../lib/api";

function ConfigCard({
  config,
  selected,
  onToggle,
  disabled,
}: {
  config: ExperimentConfigSummary;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const { data: runs } = useExperimentRuns(config.id);
  const doneRuns = (runs ?? []).filter((r) => r.status === "done");

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`rounded-xl border-2 p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-primary bg-primary/10 shadow-[0_0_28px_-10px_var(--neon-glow)]"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md"
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <span className="text-sm font-semibold text-foreground">{config.name}</span>
        {selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shadow-sm">
            ✓
          </span>
        )}
      </div>
      <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
        {config.policy}
      </span>
      <div className="mt-2 text-xs text-muted-foreground">
        {doneRuns.length} completed run{doneRuns.length !== 1 ? "s" : ""}
      </div>
    </button>
  );
}

function RunSummaryRow({ configId, configName, policy }: { configId: string; configName: string; policy: string }) {
  const { data: runs } = useExperimentRuns(configId);
  const doneRuns = (runs ?? []).filter((r) => r.status === "done");

  if (doneRuns.length === 0) return null;

  return (
    <>
      {doneRuns.map((run) => (
        <RunDetailRow key={run.id} runId={run.id} configName={configName} policy={policy} />
      ))}
    </>
  );
}

function RunDetailRow({ runId, configName, policy }: { runId: string; configName: string; policy: string }) {
  const { data } = useExperimentRun(runId);
  const s = data?.summary;
  if (!s) return null;

  return (
    <tr className="data-table-row">
      <td className="data-table-cell font-medium">{configName}</td>
      <td className="data-table-cell">
        <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary">
          {policy}
        </span>
      </td>
      <td className="data-table-cell">{s.avg_wait_time.toFixed(1)}s</td>
      <td className="data-table-cell">{s.avg_turnaround_time.toFixed(1)}s</td>
      <td className="data-table-cell">
        {s.jobs_completed}/{s.jobs_total}
      </td>
    </tr>
  );
}

function ChartEntry({
  configId,
  configName,
  onData,
}: {
  configId: string;
  configName: string;
  onData: (name: string, avgWait: number, avgTurnaround: number) => void;
}) {
  const { data: runs } = useExperimentRuns(configId);
  const doneRuns = (runs ?? []).filter((r) => r.status === "done");

  return (
    <>
      {doneRuns.map((run) => (
        <ChartRunEntry key={run.id} runId={run.id} configName={configName} onData={onData} />
      ))}
    </>
  );
}

function ChartRunEntry({
  runId,
  configName,
  onData,
}: {
  runId: string;
  configName: string;
  onData: (name: string, avgWait: number, avgTurnaround: number) => void;
}) {
  const { data } = useExperimentRun(runId);
  if (data?.summary) {
    onData(configName, data.summary.avg_wait_time, data.summary.avg_turnaround_time);
  }
  return null;
}

function ComparisonSection({
  selectedIds,
  configs,
}: {
  selectedIds: string[];
  configs: ExperimentConfigSummary[];
}) {
  const chartData: { name: string; "Avg Wait (s)": number; "Avg Turnaround (s)": number }[] = [];

  const handleData = (name: string, avgWait: number, avgTurnaround: number) => {
    if (!chartData.find((r) => r.name === name)) {
      chartData.push({ name, "Avg Wait (s)": parseFloat(avgWait.toFixed(1)), "Avg Turnaround (s)": parseFloat(avgTurnaround.toFixed(1)) });
    }
  };

  return (
    <div className="space-y-6">
      {selectedIds.map((id) => {
        const cfg = configs.find((c) => c.id === id);
        if (!cfg) return null;
        return <ChartEntry key={id} configId={id} configName={cfg.name} onData={handleData} />;
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="data-table-head">
              <tr>
                <th className="data-table-th">Experiment</th>
                <th className="data-table-th">Policy</th>
                <th className="data-table-th">Avg Wait</th>
                <th className="data-table-th">Avg Turnaround</th>
                <th className="data-table-th">Jobs Done</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {selectedIds.map((id) => {
                const cfg = configs.find((c) => c.id === id);
                if (!cfg) return null;
                return <RunSummaryRow key={id} configId={id} configName={cfg.name} policy={cfg.policy} />;
              })}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wait vs Turnaround</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="s" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Avg Wait (s)" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Avg Turnaround (s)" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ExperimentComparison() {
  const { data: configs, isLoading, error } = useExperimentConfigs();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 3)
    );

  return (
    <Card
      variant="highlight"
      className="neon-surface gap-6 bg-gradient-to-br from-primary/[0.12] via-background to-primary/[0.06] dark:from-primary/15 dark:via-card dark:to-primary/8"
    >
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-3 text-primary-foreground shadow-[0_0_24px_-8px_var(--neon-glow)] ring-1 ring-primary/30">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Experiment Comparison</CardTitle>
            <CardDescription>Select up to 3 experiments to compare side-by-side</CardDescription>
          </div>
        </div>
        {selected.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setSelected([])} className="shrink-0">
            Clear Selection
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-0">

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading experiments…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> Backend unreachable
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(configs ?? []).map((cfg) => (
              <ConfigCard
                key={cfg.id}
                config={cfg}
                selected={selected.includes(cfg.id)}
                onToggle={() => toggle(cfg.id)}
                disabled={selected.length >= 3}
              />
            ))}
            {(configs ?? []).length === 0 && (
              <div className="col-span-3 py-8 text-center text-muted-foreground">
                No experiment configurations found. Create one in the Experiments tab.
              </div>
            )}
          </div>

          {selected.length > 0 && configs && (
            <ComparisonSection selectedIds={selected} configs={configs} />
          )}

          {selected.length === 0 && (configs ?? []).length > 0 && (
            <Card variant="inset" className="gap-0">
              <CardContent className="py-10 text-center">
              <GitCompare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground">Select experiments above to begin comparison</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </CardContent>
    </Card>
  );
}
