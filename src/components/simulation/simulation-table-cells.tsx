import { Trash2 } from "lucide-react";

import { useSimulation } from "../../lib/hooks";
import type { SimulationSummary } from "../../lib/api";
import { Skeleton } from "../ui/skeleton";

export function SimulationPolicyBadge({ policy }: { policy: string }) {
  return (
    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
      {policy}
    </span>
  );
}

export function SimulationStatusBadge({ status }: { status: SimulationSummary["status"] }) {
  const cls =
    status === "done"
      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400"
      : status === "running"
        ? "animate-pulse bg-primary/15 text-primary"
        : status === "failed"
          ? "bg-destructive/15 text-destructive"
          : "bg-muted text-muted-foreground";
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

function MetricSkeleton() {
  return <Skeleton className="inline-block h-4 w-14" />;
}

export function SimulationWaitCell({ simId }: { simId: string }) {
  const { data, isLoading } = useSimulation(simId);
  if (isLoading) return <MetricSkeleton />;
  const s = data?.summary;
  return <span>{s ? `${s.avg_wait_time.toFixed(1)}s` : "—"}</span>;
}

export function SimulationTurnaroundCell({ simId }: { simId: string }) {
  const { data, isLoading } = useSimulation(simId);
  if (isLoading) return <MetricSkeleton />;
  const s = data?.summary;
  return <span>{s ? `${s.avg_turnaround_time.toFixed(1)}s` : "—"}</span>;
}

export function SimulationJobsCell({ simId }: { simId: string }) {
  const { data, isLoading } = useSimulation(simId);
  if (isLoading) return <MetricSkeleton />;
  const s = data?.summary;
  return <span>{s ? `${s.jobs_completed}/${s.jobs_total}` : "—"}</span>;
}

export function SimulationEnergyCell({ simId }: { simId: string }) {
  const { data, isLoading } = useSimulation(simId);
  if (isLoading) return <MetricSkeleton />;
  const s = data?.summary;
  return <span>{s ? `${(s.total_energy_joules / 1000).toFixed(1)} kJ` : "—"}</span>;
}

export function SimulationDeleteButton({ simId, onDelete }: { simId: string; onDelete: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onDelete(simId)}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      aria-label="Delete simulation"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
