import { useMemo, useState } from "react";
import { Settings, Brain, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { usePolicies, useSimulations } from "../lib/hooks";

const POLICY_ICONS: Record<string, typeof Settings> = {
  easybackfill: Brain,
  rl: Brain,
};

export function SchedulerControls() {
  const navigate = useNavigate();
  const { data: simPage } = useSimulations(undefined, { limit: 2000 });
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const sims = simPage?.items ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  const doneSims = useMemo(() => sims.filter((s) => s.status === "done"), [sims]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Policies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference for supported scheduling policies. Choose one in Cluster Simulation when you launch a run.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Scheduling policies</CardTitle>
            <CardDescription>
              Click a policy card to highlight it. The run count shows how many completed simulations used that policy.
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => navigate("/help")}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="How to add a new policy"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-0">
          {policiesLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          )}
          {!policiesLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(policies ?? []).map((p) => {
                const Icon = POLICY_ICONS[p.value] ?? Settings;
                const count = doneSims.filter((s) => s.policy === p.value).length;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setSelected(selected === p.value ? null : p.value)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selected === p.value
                        ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--neon-glow)]"
                        : "border-border bg-card hover:border-primary/35 hover:bg-muted/30"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="rounded-lg bg-muted p-2 ring-1 ring-border">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {count > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {count} runs
                        </span>
                      )}
                    </div>
                    <div className="mb-1 text-sm font-semibold text-foreground">{p.label}</div>
                    <div className="text-xs leading-relaxed text-muted-foreground">{p.description}</div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
