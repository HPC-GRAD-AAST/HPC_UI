import { useState } from "react";
import {
  Plus,
  Trash2,
  Server,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { useClusters, useCluster, useCreateCluster, useDeleteCluster } from "../lib/hooks";
import type { ClusterCreate, ClusterSummary, NodeCreate } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { MemoryField } from "./ui/memory-field";
import { formatMemSummary } from "../lib/memory-units";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const DEFAULT_NODE: NodeCreate = {
  total_cpus: 32,
  total_mem: 65536,
  idle_watts: 200,
  max_watts: 500,
  zone: "default",
  node_type: "compute",
};

function NodeForm({
  node,
  index,
  onChange,
  onRemove,
}: {
  node: NodeCreate;
  index: number;
  onChange: (n: NodeCreate) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(index === 0);

  const toggleOpen = () => setOpen((v) => !v);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex w-full items-center justify-between bg-muted/40 px-4 py-3">
        <div
          role="button"
          tabIndex={0}
          className="min-w-0 flex-1 cursor-pointer py-0.5 text-start transition-colors hover:text-foreground"
          onClick={toggleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleOpen();
            }
          }}
        >
          <span className="text-sm font-medium text-foreground">
            Node {index + 1} — {node.total_cpus} CPUs · {formatMemSummary(node.total_mem)} · {node.zone}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Remove node ${index + 1}`}
            onClick={onRemove}
            className="rounded p-1 text-red-400 hover:bg-destructive/10 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Collapse node details" : "Expand node details"}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={toggleOpen}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">CPU Cores</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={node.total_cpus}
              onChange={(e) => onChange({ ...node, total_cpus: parseInt(e.target.value) || 1 })}
              className="native-field native-field-sm"
            />
          </div>
          <div className="col-span-2">
            <MemoryField
              label="Node memory"
              valueMb={node.total_mem}
              onValueMbChange={(total_mem) => onChange({ ...node, total_mem })}
              minMb={512}
              maxMb={64 * 1024 * 1024}
              stepMb={512}
              showSlider={false}
              className="[&_.native-label]:mb-1 [&_.native-label]:block [&_.native-label]:text-xs [&_.native-label]:font-medium [&_.native-label]:text-muted-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Idle Watts</label>
            <input
              type="number"
              min="0"
              value={node.idle_watts}
              onChange={(e) => onChange({ ...node, idle_watts: parseFloat(e.target.value) || 0 })}
              className="native-field native-field-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Watts</label>
            <input
              type="number"
              min="0"
              value={node.max_watts}
              onChange={(e) => onChange({ ...node, max_watts: parseFloat(e.target.value) || 0 })}
              className="native-field native-field-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Zone</label>
            <input
              type="text"
              value={node.zone ?? "default"}
              onChange={(e) => onChange({ ...node, zone: e.target.value })}
              className="native-field native-field-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Node Type</label>
            <select
              value={node.node_type ?? "compute"}
              onChange={(e) => onChange({ ...node, node_type: e.target.value })}
              className="native-field native-field-sm"
            >
              <option value="compute">compute</option>
              <option value="gpu">gpu</option>
              <option value="storage">storage</option>
              <option value="highmem">highmem</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ClusterBuilder() {
  const { data: clusters, isLoading, error, refetch, isFetching } = useClusters();
  const { mutate: createCluster, isPending } = useCreateCluster();
  const { mutate: deleteCluster, isPending: deleting } = useDeleteCluster();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClusterSummary | null>(null);

  const { data: detailCluster, isLoading: detailLoading } = useCluster(detailId);

  const [name, setName] = useState("");
  const [bandwidth, setBandwidth] = useState(10);
  const [nodes, setNodes] = useState<NodeCreate[]>([{ ...DEFAULT_NODE }]);
  const [formError, setFormError] = useState("");

  const resetCreateForm = () => {
    setName("");
    setBandwidth(10);
    setNodes([{ ...DEFAULT_NODE }]);
    setFormError("");
  };

  const updateNode = (i: number, n: NodeCreate) =>
    setNodes((prev) => prev.map((x, idx) => (idx === i ? n : x)));

  const removeNode = (i: number) => setNodes((prev) => prev.filter((_, idx) => idx !== i));

  const addNode = () => setNodes((prev) => [...prev, { ...DEFAULT_NODE }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Cluster name is required");
      return;
    }
    if (nodes.length === 0) {
      setFormError("Add at least one node");
      return;
    }

    const body: ClusterCreate = { name: name.trim(), bandwidth, nodes };
    createCluster(body, {
      onSuccess: () => {
        resetCreateForm();
        setCreateOpen(false);
      },
      onError: () => setFormError("Failed to create cluster. Is the backend running?"),
    });
  };

  const list = clusters ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clusters</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Register compute clusters for simulations, benchmarks, and experiments. Use the table below; create
            and inspect resources from the action buttons.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="gap-2">
            <Plus className="size-4" />
            New cluster
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 py-4">
          <CardTitle className="text-base font-semibold">All clusters</CardTitle>
          <CardDescription className="text-muted-foreground">
            {list.length} cluster{list.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading clusters…</div>
          )}
          {error && (
            <div className="m-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> Could not load clusters. Check the API.
            </div>
          )}
          {!isLoading && !error && list.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Server className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No clusters yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create a cluster to attach nodes and run simulations against it.
              </p>
              <Button type="button" size="sm" onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="gap-2">
                <Plus className="size-4" />
                New cluster
              </Button>
            </div>
          )}
          {!isLoading && !error && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="data-table-head">
                  <tr>
                    <th className="data-table-th">Name</th>
                    <th className="data-table-th">Nodes</th>
                    <th className="data-table-th">Bandwidth</th>
                    <th className="data-table-th">Created</th>
                    <th className="data-table-th w-[200px] text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="data-table-body">
                  {list.map((cluster) => (
                    <tr key={cluster.id} className="data-table-row">
                      <td className="data-table-cell">
                        <div className="flex items-center gap-2">
                          <Server className="size-4 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">{cluster.name}</span>
                        </div>
                      </td>
                      <td className="data-table-cell text-muted-foreground">{cluster.node_count}</td>
                      <td className="data-table-cell text-muted-foreground">{cluster.bandwidth} Gbps</td>
                      <td className="data-table-cell text-muted-foreground">{formatShortDate(cluster.created_at)}</td>
                      <td className="data-table-cell text-end">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 px-2"
                            onClick={() => setDetailId(cluster.id)}
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(cluster)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[min(90vh,880px)] gap-0 overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New cluster</DialogTitle>
            <DialogDescription>Define a name, network bandwidth, and one or more nodes.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <form id="cluster-create-form" onSubmit={handleSubmit} className="space-y-5 px-1 pb-4 pt-2">
            <div>
              <label className="native-label">Cluster name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. research-cluster-1"
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">Network bandwidth (Gbps)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={bandwidth}
                onChange={(e) => setBandwidth(parseFloat(e.target.value) || 1)}
                className="native-field"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Nodes ({nodes.length})</label>
                <Button type="button" variant="secondary" size="sm" onClick={addNode} className="h-8 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add node
                </Button>
              </div>
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {nodes.map((node, i) => (
                  <NodeForm
                    key={i}
                    node={node}
                    index={i}
                    onChange={(n) => updateNode(i, n)}
                    onRemove={() => removeNode(i)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="mb-2 font-medium text-foreground">Summary</div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  Nodes: <span className="text-foreground">{nodes.length}</span>
                </div>
                <div>
                  Total CPUs:{" "}
                  <span className="text-foreground">{nodes.reduce((a, n) => a + n.total_cpus, 0)}</span>
                </div>
                <div>
                  Total RAM:{" "}
                  <span className="text-foreground">
                    {(nodes.reduce((a, n) => a + n.total_mem, 0) / 1024).toFixed(0)} GB
                  </span>
                </div>
                <div>
                  Bandwidth: <span className="text-foreground">{bandwidth} Gbps</span>
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="border-t border-border bg-muted/10 px-6 py-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="cluster-create-form" disabled={isPending} className="gap-2">
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isPending ? "Creating…" : "Create cluster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="size-5 text-primary" />
              {detailCluster?.name ?? "Cluster details"}
            </DialogTitle>
            <DialogDescription>
              {detailCluster
                ? `Full cluster record and node inventory.`
                : detailLoading
                  ? "Loading…"
                  : "Could not load cluster."}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <span className="block py-8 text-center text-sm text-muted-foreground">Loading…</span>
          )}

          {!detailLoading && detailCluster && (
            <div className="space-y-4 px-1 pb-4">
              <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Cluster ID</span>
                  <p className="mt-0.5 break-all font-mono text-xs text-foreground">{detailCluster.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bandwidth</span>
                  <p className="mt-0.5 text-foreground">{detailCluster.bandwidth} Gbps</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="mt-0.5 text-foreground">{formatShortDate(detailCluster.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated</span>
                  <p className="mt-0.5 text-foreground">{formatShortDate(detailCluster.updated_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Nodes</h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="data-table-head">
                      <tr>
                        <th className="data-table-th">ID</th>
                        <th className="data-table-th">CPUs</th>
                        <th className="data-table-th">Memory</th>
                        <th className="data-table-th">Zone</th>
                        <th className="data-table-th">Type</th>
                      </tr>
                    </thead>
                    <tbody className="data-table-body">
                      {detailCluster.nodes.map((n) => (
                        <tr key={n.id} className="data-table-row">
                          <td className="data-table-cell font-mono text-xs text-muted-foreground">
                            {n.id.slice(0, 12)}…
                          </td>
                          <td className="data-table-cell">{n.total_cpus}</td>
                          <td className="data-table-cell">{formatMemSummary(n.total_mem)}</td>
                          <td className="data-table-cell text-muted-foreground">{n.zone ?? "—"}</td>
                          <td className="data-table-cell text-muted-foreground">{n.node_type ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="secondary" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete cluster?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name ?? "this cluster"}</span> from
              the platform. Simulations that reference it may fail. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={() => {
                if (deleteTarget) deleteCluster(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {deleting ? "Deleting…" : "Delete cluster"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
