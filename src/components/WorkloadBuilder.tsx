import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitBranch, Pencil, Plus, Trash2, Upload } from "lucide-react";
import {
  useCreateWorkflowDefinition,
  useDeleteWorkflowDefinition,
  useMaterializeWorkflowDefinition,
  useUpdateWorkflowDefinition,
  useWorkflowDefinition,
  useWorkflowDefinitions,
} from "../lib/hooks";
import type { WorkflowDefinitionSummary, WorkflowGraphStored } from "../lib/api";
import { formatMemSummary } from "../lib/memory-units";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DataTable, DataTableColumnHeader } from "./ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { MemoryField } from "./ui/memory-field";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";

type JobNodeData = {
  label: string;
  duration: number;
  cpuReq: number;
  memReq: number;
};

function JobNode({ id, data, selected }: NodeProps) {
  const d = data as JobNodeData;
  return (
    <div
      className={`min-w-[160px] rounded-lg border-2 bg-card px-3 py-2 shadow-sm ${
        selected ? "border-primary shadow-[0_0_20px_-8px_var(--neon-glow)]" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="text-xs font-semibold text-foreground">{d.label}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        {d.cpuReq} CPU · {formatMemSummary(d.memReq)} · {d.duration}s
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

const nodeTypes = { job: JobNode };

const defaultGraphNodes: Node<JobNodeData>[] = [
  {
    id: "a",
    type: "job",
    position: { x: 120, y: 80 },
    data: { label: "Stage A", duration: 120, cpuReq: 2, memReq: 4096 },
  },
];

function normCpu(n: WorkflowGraphStored["nodes"][0]): number {
  return n.cpu_req ?? n.cpuReq ?? 2;
}

function normMem(n: WorkflowGraphStored["nodes"][0]): number {
  return n.mem_req ?? n.memReq ?? 4096;
}

function storedToFlow(graph: WorkflowGraphStored): { nodes: Node<JobNodeData>[]; edges: Edge[] } {
  const nodes: Node<JobNodeData>[] = (graph.nodes ?? []).map((n, i) => ({
    id: n.id,
    type: "job",
    position: {
      x: n.x ?? 80 + (i % 4) * 180,
      y: n.y ?? 60 + Math.floor(i / 4) * 140,
    },
    data: {
      label: n.label ?? "task",
      duration: n.duration ?? 60,
      cpuReq: normCpu(n),
      memReq: normMem(n),
    },
  }));
  const edges: Edge[] = (graph.edges ?? []).map((e, i) => ({
    id: e.id ?? `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));
  return { nodes, edges };
}

function flowToStored(nodes: Node<JobNodeData>[], edges: Edge[]): WorkflowGraphStored {
  return {
    nodes: nodes.map((n) => {
      const d = n.data as JobNodeData;
      return {
        id: n.id,
        label: d.label,
        duration: d.duration,
        cpuReq: d.cpuReq,
        memReq: d.memReq,
        dataSizeGb: 0.1,
        priority: "NORMAL",
        queueName: "default",
        maxRetries: 0,
        submissionTime: 0,
        x: n.position.x,
        y: n.position.y,
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
}

function WorkflowGraphEditor({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
}: {
  nodes: Node<JobNodeData>[];
  edges: Edge[];
  setNodes: Dispatch<SetStateAction<Node<JobNodeData>[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onNodesChange: ReturnType<typeof useNodesState<Node<JobNodeData>>>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
}) {
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addNode = () => {
    const nid = `n-${crypto.randomUUID().slice(0, 8)}`;
    setNodes((ns) => [
      ...ns,
      {
        id: nid,
        type: "job",
        position: { x: 80 + Math.random() * 200, y: 80 + Math.random() * 160 },
        data: { label: `Task ${ns.length + 1}`, duration: 60, cpuReq: 2, memReq: 4096 },
      },
    ]);
  };

  const selectedId = useMemo(
    () => nodes.find((n) => n.selected)?.id ?? nodes[0]?.id,
    [nodes],
  );

  const updateSelectedData = (patch: Partial<JobNodeData>) => {
    if (!selectedId) return;
    setNodes((ns) =>
      ns.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);
  const selData = (selectedNode?.data ?? {}) as JobNodeData;

  return (
    <div className="grid max-h-[min(70vh,640px)] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_280px]">
      <div className="min-h-[360px] rounded-lg border border-border bg-muted/10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="h-[360px] lg:h-full lg:min-h-[400px]"
        >
          <Background />
          <Controls />
          <MiniMap className="!bg-card" />
          <Panel position="top-left" className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={addNode}>
              <Plus className="size-4" />
              Add job
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setNodes((ns) => ns.filter((n) => !n.selected));
                setEdges([]);
              }}
            >
              <Trash2 className="size-4" />
              Remove selected
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      <div className="space-y-3 overflow-y-auto rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">Connect nodes top → bottom for dependencies.</p>
        <div>
          <label className="native-label">Name</label>
          <Input
            value={selData.label ?? ""}
            onChange={(e) => updateSelectedData({ label: e.target.value })}
          />
        </div>
        <div>
          <label className="native-label">Duration (s)</label>
          <Input
            type="number"
            min={1}
            value={selData.duration ?? 60}
            onChange={(e) => updateSelectedData({ duration: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="native-label">CPU</label>
          <Input
            type="number"
            min={1}
            value={selData.cpuReq ?? 2}
            onChange={(e) => updateSelectedData({ cpuReq: Number(e.target.value) })}
          />
        </div>
        <MemoryField
          label="Memory"
          valueMb={selData.memReq ?? 4096}
          onValueMbChange={(mb) => updateSelectedData({ memReq: mb })}
          minMb={256}
          maxMb={2 * 1024 * 1024}
          stepMb={256}
        />
        <p className="text-[10px] text-muted-foreground">
          Node positions are saved with the workflow (optional x/y) so the graph restores when you edit.
        </p>
      </div>
    </div>
  );
}

function WorkflowEditorDialog({
  open,
  onOpenChange,
  editingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingId: string | null;
}) {
  const { data: loaded, isLoading } = useWorkflowDefinition(editingId, open);
  const { mutate: createWf, isPending: creating } = useCreateWorkflowDefinition();
  const { mutate: updateWf, isPending: updating } = useUpdateWorkflowDefinition();

  const [name, setName] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<JobNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      if (isLoading || !loaded) {
        setNodes([]);
        setEdges([]);
        return;
      }
      setName(loaded.name);
      const { nodes: ns, edges: es } = storedToFlow(loaded.graph);
      setNodes(ns);
      setEdges(es);
    } else {
      setName("");
      setNodes(defaultGraphNodes);
      setEdges([]);
    }
  }, [open, editingId, isLoading, loaded, setNodes, setEdges]);

  const saving = creating || updating;
  const showLoader = open && !!editingId && (isLoading || !loaded);

  const handleSave = () => {
    const n = name.trim();
    if (!n) {
      toast.error("Workflow name is required");
      return;
    }
    const graph = flowToStored(nodes as Node<JobNodeData>[], edges);
    if (graph.nodes.length === 0) {
      toast.error("Add at least one job node");
      return;
    }
    if (editingId) {
      updateWf(
        { id: editingId, body: { name: n, graph } },
        {
          onSuccess: () => {
            toast.success("Workflow updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Could not save workflow"),
        },
      );
    } else {
      createWf(
        { name: n, graph },
        {
          onSuccess: () => {
            toast.success("Workflow created");
            onOpenChange(false);
          },
          onError: () => toast.error("Could not create workflow"),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[min(96vw,1100px)] flex-col gap-4 overflow-hidden sm:max-w-[min(96vw,1100px)]">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit workflow" : "New workflow"}</DialogTitle>
          <DialogDescription>
            Build a DAG, then save. Use &quot;Create jobs&quot; from the list — jobs are grouped by run for Simulations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="native-label">Workflow name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. nightly ETL"
              disabled={showLoader}
            />
          </div>
          {showLoader ? (
            <div className="flex justify-center py-16">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : (
            <WorkflowGraphEditor
              nodes={nodes as Node<JobNodeData>[]}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || showLoader} onClick={handleSave}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Create workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkloadBuilder() {
  const { data: rows, isLoading } = useWorkflowDefinitions();
  const { mutate: remove } = useDeleteWorkflowDefinition();
  const { mutate: materialize, isPending: matPending } = useMaterializeWorkflowDefinition();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const columns = useMemo<ColumnDef<WorkflowDefinitionSummary>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: "updated_at",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.updated_at).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.updated_at).getTime() - new Date(b.original.updated_at).getTime(),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row.original.id)}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={matPending}
              onClick={() =>
                materialize(row.original.id, {
                  onSuccess: (res) => {
                    const g = res.jobGroupName;
                    toast.success(
                      g
                        ? `Created ${res.jobIds.length} jobs in group “${g}”. Open Simulations to run.`
                        : `Created ${res.jobIds.length} jobs — open Simulations to run.`,
                    );
                  },
                  onError: () => toast.error("Could not create jobs (check the graph is a valid DAG)."),
                })
              }
            >
              <Upload className="size-3.5" />
              Create jobs
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (window.confirm(`Delete workflow “${row.original.name}”?`)) remove(row.original.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [materialize, matPending, remove],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Saved workflows</CardTitle>
            <CardDescription>
              Edit saved graphs here. <strong>Create jobs</strong> turns a workflow into real jobs in a dated group so
              you can filter them under Simulations.
            </CardDescription>
          </div>
          <Button type="button" onClick={openNew} className="shadow-[0_0_24px_-8px_var(--neon-glow)]">
            <Plus className="size-4" />
            New workflow
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!isLoading && (!rows || rows.length === 0) && (
            <EmptyState
              icon={GitBranch}
              title="No saved workflows"
              description="Save a workflow, then use Create jobs — jobs land in a timestamped group for easy filtering."
            />
          )}
          {!isLoading && rows && rows.length > 0 && (
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage="No workflows."
              globalFilterPlaceholder="Search by name…"
            />
          )}
        </CardContent>
      </Card>

      <WorkflowEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingId={editingId}
      />
    </div>
  );
}
