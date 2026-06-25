import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Send, AlertCircle, Clock, Database, Trash2, RefreshCw, Plus, FolderPlus } from "lucide-react";
import { useCreateJob, useJobs, useDeleteJob, useJobGroups, useCreateJobGroup } from "../lib/hooks";
import type { JobCreate, JobSummary } from "../lib/api";
import { formatApiError } from "../lib/api-errors";
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
import { EmptyState } from "./ui/empty-state";
import { MemoryField } from "./ui/memory-field";
import { Skeleton } from "./ui/skeleton";
import { formatMemSummary } from "../lib/memory-units";

const PRIORITY_MAP: Record<string, "LOW" | "NORMAL" | "HIGH"> = {
  low: "LOW",
  normal: "NORMAL",
  high: "HIGH",
};

function JobsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function JobSubmission() {
  const { data: jobsPage, isLoading } = useJobs({ limit: 2000 });
  const jobs = jobsPage?.items ?? [];
  const { data: jobGroups } = useJobGroups();
  const { mutate: createJob, isPending, error } = useCreateJob();
  const { mutate: createGroup, isPending: creatingGroup } = useCreateJobGroup();
  const { mutate: deleteJob } = useDeleteJob();

  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [form, setForm] = useState({
    name: "",
    cpu_req: 4,
    mem_req: 8192,
    duration: 60,
    data_size_gb: 0.1,
    priority: "normal",
    submission_time: 0,
    group_id: "" as string,
  });
  const [formError, setFormError] = useState("");

  const columns = useMemo<ColumnDef<JobSummary>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 12)}…</span>
        ),
        sortingFn: (a, b) => a.original.id.localeCompare(b.original.id),
      },
      {
        accessorKey: "cpuReq",
        header: ({ column }) => <DataTableColumnHeader column={column} title="CPU" />,
        cell: ({ row }) => <span>{row.original.cpuReq} cores</span>,
      },
      {
        accessorKey: "memReq",
        header: ({ column }) => <DataTableColumnHeader column={column} title="RAM" />,
        cell: ({ row }) => <span>{formatMemSummary(row.original.memReq)}</span>,
      },
      {
        accessorKey: "duration",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
        cell: ({ row }) => <span>{row.original.duration}s</span>,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => (
          <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {row.original.priority}
          </span>
        ),
        filterFn: (row, columnId, filterValue) =>
          filterValue == null || filterValue === "" || filterValue === "all" || row.getValue(columnId) === filterValue,
      },
      {
        id: "groupName",
        accessorFn: (row) => row.groupName ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.groupName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.createdAt).getTime() - new Date(b.original.createdAt).getTime(),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Ready
            </span>
            <button
              type="button"
              onClick={() => deleteJob(row.original.id)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete job ${row.original.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [deleteJob],
  );

  const resetForm = () => {
    setForm({
      name: "",
      cpu_req: 4,
      mem_req: 8192,
      duration: 60,
      data_size_gb: 0.1,
      priority: "normal",
      submission_time: 0,
      group_id: "",
    });
    setNewGroupName("");
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("Job name is required");
      return;
    }

    const body: JobCreate = {
      name: form.name,
      cpu_req: form.cpu_req,
      mem_req: form.mem_req,
      duration: form.duration,
      data_size_gb: form.data_size_gb,
      priority: PRIORITY_MAP[form.priority],
      submission_time: form.submission_time,
      queue_name: "default",
      max_retries: 0,
      ...(form.group_id ? { group_id: form.group_id } : {}),
    };

    createJob(body, {
      onSuccess: () => {
        resetForm();
        setCreateOpen(false);
      },
      onError: (err) => setFormError(formatApiError(err)),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jobs</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Persisted workloads for simulations. Filter and sort the table; create jobs from the modal.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" />
          New job
        </Button>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20 py-4">
          <CardTitle className="text-base font-semibold">Job catalog</CardTitle>
          <CardDescription>
            {isLoading ? "Loading…" : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} in this project`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading && <JobsTableSkeleton />}
          {!isLoading && (!jobs || jobs.length === 0) && (
            <EmptyState
              icon={Database}
              title="No jobs yet"
              description="Create a job with New job. It will show up here for simulations and scheduling."
            />
          )}
          {!isLoading && jobs && jobs.length > 0 && (
            <DataTable
              columns={columns}
              data={jobs}
              emptyMessage="No jobs."
              globalFilterPlaceholder="Search name, ID, priority…"
              filterBar={(table) => (
                <select
                  className="native-field h-9 max-w-[160px] text-sm"
                  aria-label="Filter by priority"
                  value={(table.getColumn("priority")?.getFilterValue() as string | undefined) ?? "all"}
                  onChange={(e) => {
                    const v = e.target.value;
                    table.getColumn("priority")?.setFilterValue(v === "all" ? undefined : v);
                  }}
                >
                  <option value="all">All priorities</option>
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                </select>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit new job</DialogTitle>
            <DialogDescription>Configure and persist a job for the cluster scheduler.</DialogDescription>
          </DialogHeader>

          {(formError || error) && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>{formError || "Submission failed"}</div>
            </div>
          )}

          <form id="job-create-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="native-label">Job name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. data-processing-task"
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">CPU cores — {form.cpu_req}</label>
              <input
                type="range"
                min={1}
                max={128}
                value={form.cpu_req}
                onChange={(e) => setForm({ ...form, cpu_req: parseInt(e.target.value) })}
                className="accent-primary w-full"
              />
            </div>

            <MemoryField
              label="Memory"
              valueMb={form.mem_req}
              onValueMbChange={(mem_req) => setForm((f) => ({ ...f, mem_req }))}
              minMb={512}
              maxMb={131_072}
              stepMb={256}
            />

            <div>
              <label className="native-label">Duration (seconds)</label>
              <input
                type="number"
                min={1}
                max={86400}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">Data size (GB)</label>
              <input
                type="number"
                min={0}
                max={1000}
                step={0.1}
                value={form.data_size_gb}
                onChange={(e) => setForm({ ...form, data_size_gb: parseFloat(e.target.value) })}
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">Submission time (offset seconds)</label>
              <input
                type="number"
                min={0}
                value={form.submission_time}
                onChange={(e) => setForm({ ...form, submission_time: parseFloat(e.target.value) })}
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="native-field"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              <label className="native-label">Job group (optional)</label>
              <p className="text-xs text-muted-foreground">
                Groups help you filter and select batches on the simulation designer.
              </p>
              <select
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                className="native-field"
              >
                <option value="">No group</option>
                {(jobGroups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New group name…"
                  className="native-field flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={creatingGroup || !newGroupName.trim()}
                  onClick={() => {
                    const n = newGroupName.trim();
                    if (!n) return;
                    createGroup(
                      { name: n },
                      {
                        onSuccess: (g) => {
                          setForm((f) => ({ ...f, group_id: g.id }));
                          setNewGroupName("");
                        },
                        onError: (err) => setFormError(formatApiError(err)),
                      },
                    );
                  }}
                >
                  <FolderPlus className="size-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/40 p-4">
              <div>
                <div className="text-sm text-muted-foreground">CPU</div>
                <div className="text-sm text-foreground">{form.cpu_req} cores</div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.min((form.cpu_req / 128) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">RAM</div>
                <div className="text-sm text-foreground">{formatMemSummary(form.mem_req)}</div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                    style={{ width: `${Math.min((form.mem_req / 131_072) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="job-create-form" disabled={isPending}>
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
