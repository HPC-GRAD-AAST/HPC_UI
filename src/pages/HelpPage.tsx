import { BookOpen, Code2, FileCode2, GitBranch, Info, ListChecks, Package, Puzzle, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Section({ icon: Icon, title, children }: { icon: typeof BookOpen; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <div className="mt-1 space-y-2">{children}</div>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs text-foreground">
      {children.trim()}
    </pre>
  );
}

function FilePath({ children }: { children: string }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary">{children}</code>
  );
}

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Help & Documentation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reference guides for using and extending the HPC Scheduling Platform.
        </p>
      </div>

      {/* ── Adding a new policy ── */}
      <Section icon={Puzzle} title="Adding a new scheduling policy">
        <p>
          The platform is designed so that adding a new policy requires touching only the simulator folder.
          The frontend picks it up automatically with no code changes needed.
        </p>

        <div className="space-y-5 pt-1">
          <Step n={1} title="Create the policy file">
            <p>Create a new <code className="text-xs">.py</code> file inside:</p>
            <FilePath>HPC_Simulator/src/sim/policies/your_policy.py</FilePath>
            <p className="mt-2">The file must contain a class that extends <code className="text-xs">SchedulerPolicy</code> and implements the <code className="text-xs">schedule()</code> method:</p>
            <CodeBlock>{`
from typing import List, Tuple
from sim.models.entities import Cluster, Job
from sim.policies.base import SchedulerPolicy

class YourScheduler(SchedulerPolicy):
    def schedule(
        self,
        cluster: Cluster,
        waiting_queue: List[Job],
    ) -> List[Tuple[Job, str]]:
        decisions = []

        for job in waiting_queue:
            # Use the built-in helper to filter nodes that
            # have enough CPU and memory for this job
            suitable_nodes = self._find_suitable_nodes(job, cluster)

            if suitable_nodes:
                # Pick a node — your logic goes here
                chosen_node = suitable_nodes[0]
                decisions.append((job, chosen_node.id))

        return decisions
            `}</CodeBlock>
          </Step>

          <Step n={2} title="Register in the factory">
            <p>Open:</p>
            <FilePath>HPC_Simulator/src/sim/policies/scheduler_factory.py</FilePath>
            <p className="mt-2">Add the import and register the class in the <code className="text-xs">schedulers</code> dict:</p>
            <CodeBlock>{`
from sim.policies.your_policy import YourScheduler

schedulers: dict[str, type[SchedulerPolicy]] = {
    "fcfs": FCFSScheduler,
    # ... existing policies ...
    "yourpolicy": YourScheduler,   # ← add this line
}
            `}</CodeBlock>
            <p className="mt-1">
              The key (<code className="text-xs">"yourpolicy"</code>) is the internal identifier used by the simulator engine.
              It must be lowercase with no spaces or hyphens.
            </p>
          </Step>

          <Step n={3} title="Add metadata (label & description)">
            <p>Open:</p>
            <FilePath>HPC_Simulator/src/sim/policies/metadata.py</FilePath>
            <p className="mt-2">Add one entry to <code className="text-xs">POLICY_REGISTRY</code>:</p>
            <CodeBlock>{`
POLICY_REGISTRY = [
    # ... existing entries ...
    {
        "value":       "yourpolicy",
        "label":       "Your Policy",
        "description": "One sentence explaining what it does",
    },
]
            `}</CodeBlock>
            <p className="mt-1">
              The <code className="text-xs">value</code> must match the key you used in the factory exactly.
            </p>
          </Step>

          <Step n={4} title="Restart the backend">
            <p>No reinstall needed — the package runs in editable mode, so it picks up new files automatically.</p>
            <CodeBlock>{`python main.py`}</CodeBlock>
            <p className="mt-1">The new policy will appear in every dropdown, checkbox, and policy card in the UI immediately.</p>
          </Step>
        </div>
      </Section>

      {/* ── Required structure ── */}
      <Section icon={FileCode2} title="Required policy file structure">
        <p>Your policy class <strong className="text-foreground">must</strong>:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Extend <code className="text-xs">SchedulerPolicy</code> from <FilePath>sim.policies.base</FilePath>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Implement <code className="text-xs">schedule(self, cluster, waiting_queue)</code> — this is the only required method
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Return a <code className="text-xs">List[Tuple[Job, str]]</code> — each tuple is <code className="text-xs">(job, node_id)</code>
          </li>
        </ul>

        <p className="pt-2">Available data on <strong className="text-foreground">Job</strong> objects in the queue:</p>
        <CodeBlock>{`
job.id               # Unique job ID (str)
job.cpu_req          # CPU cores required (int)
job.mem_req          # Memory required in MB (int)
job.duration         # Expected runtime in seconds (float)
job.submission_time  # When the job was submitted (float)
job.priority         # LOW | NORMAL | HIGH | URGENT
job.dependencies     # List of job IDs that must complete first
job.request_time     # User-estimated runtime, may be None (float)
        `}</CodeBlock>

        <p>Available data on <strong className="text-foreground">Node</strong> objects in <code className="text-xs">cluster.nodes</code>:</p>
        <CodeBlock>{`
node.id              # Unique node ID (str)
node.total_cpus      # Total CPU cores (int)
node.total_mem       # Total memory in MB (int)
node.available_cpus  # Free CPUs right now (property)
node.available_mem   # Free memory right now (property)
node.current_load    # 0.0–1.0 utilisation (property)
node.status          # ONLINE | OFFLINE | MAINTENANCE | DRAINING
node.can_fit(job)    # True if node has enough CPU + memory (method)
        `}</CodeBlock>

        <p>Built-in helper from the base class:</p>
        <CodeBlock>{`
# Returns only nodes that can fit the job (CPU + memory check)
suitable = self._find_suitable_nodes(job, cluster)
        `}</CodeBlock>
      </Section>

      {/* ── File locations ── */}
      <Section icon={Package} title="Key file locations">
        <div className="space-y-3">
          {[
            { path: "HPC_Simulator/src/sim/policies/",              desc: "All scheduling policy files live here" },
            { path: "HPC_Simulator/src/sim/policies/base.py",       desc: "Abstract base class — extend this in every policy" },
            { path: "HPC_Simulator/src/sim/policies/scheduler_factory.py", desc: "Registry of active policies — add your import and key here" },
            { path: "HPC_Simulator/src/sim/policies/metadata.py",   desc: "Label and description for each policy — drives the UI" },
            { path: "HPC_Simulator/src/sim/models/entities.py",     desc: "Job, Node, Cluster data models — read this to understand available fields" },
            { path: "HPC_Backend/src/routes/policies_route.py",     desc: "GET /api/v1/policies — exposes metadata.py to the frontend" },
          ].map((item) => (
            <div key={item.path} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-3">
              <FilePath>{item.path}</FilePath>
              <span className="text-muted-foreground">— {item.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How the system works ── */}
      <Section icon={GitBranch} title="How the policy system works end-to-end">
        <ol className="space-y-2">
          {[
            "User submits a simulation from the UI, selecting a policy by name",
            "Backend receives the policy name and calls get_scheduler(name) from scheduler_factory.py",
            "The factory returns an instance of the matching scheduler class",
            "The simulator calls scheduler.schedule(cluster, waiting_queue) on each scheduling round",
            "The scheduler returns a list of (job, node_id) decisions",
            "The simulator allocates jobs to nodes and advances simulation time",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-primary">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Tips ── */}
      <Section icon={Info} title="Tips & common mistakes">
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span><strong className="text-foreground">Do not mutate node state</strong> inside <code className="text-xs">schedule()</code>. The simulator handles allocation — your job is only to return decisions.</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span><strong className="text-foreground">The value key must be lowercase</strong>, no spaces or hyphens. Use letters and numbers only (e.g. <code className="text-xs">"mypolicy"</code> not <code className="text-xs">"my-policy"</code>).</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span><strong className="text-foreground">Returning an empty list is valid</strong> — it means "nothing can be scheduled right now". The simulator will retry next event.</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span><strong className="text-foreground">Dependencies are already filtered</strong> — the simulator only passes jobs whose dependencies are met into the waiting queue you receive.</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span><strong className="text-foreground">No backend restart needed</strong> for metadata changes — but a restart is needed when adding a new Python file since the factory import runs at startup.</span>
          </li>
        </ul>
      </Section>
    </div>
  );
}
