import { useState, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import {
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useTraces, useUploadTrace, useDeleteTrace, useTraceStatus } from "../lib/hooks";
import {
  type WorkloadTraceSummary,
  formatTraceJobCount,
  traceCreatedAtIso,
} from "../lib/api";
import { formatApiError } from "../lib/api-errors";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ConfirmDangerDialog } from "./ui/confirm-danger-dialog";
import { DataTable, DataTableColumnHeader } from "./ui/data-table";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";

const STATUS_META: Record<string, { icon: LucideIcon; badge: string; label: string }> = {
  processing: {
    icon: RefreshCw,
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30",
    label: "Processing",
  },
  ready: {
    icon: CheckCircle,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    label: "Ready",
  },
  failed: {
    icon: XCircle,
    badge: "bg-destructive/15 text-destructive border border-destructive/30",
    label: "Failed",
  },
};


function traceNameFromFileName(filename: string): string {
  const t = filename.trim();
  if (!t) return "";
  return t.replace(/\.[^/.]+$/, "") || t;
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META["processing"];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {meta.label}
    </span>
  );
}

function TraceStatusCell({ trace }: { trace: WorkloadTraceSummary }) {
  const { data: live } = useTraceStatus(trace.id);
  const current = live ?? trace;
  return <StatusBadge status={current.status} />;
}

function TraceJobCountCell({ trace }: { trace: WorkloadTraceSummary }) {
  const { data: live } = useTraceStatus(trace.id);
  const current = live ?? trace;
  const count = formatTraceJobCount(current);
  return <span className="tabular-nums">{count}</span>;
}

export function WorkloadTraceManager() {
  const { data: traces, isLoading, error } = useTraces();
  const { mutate: uploadTrace, isPending } = useUploadTrace();
  const { mutate: deleteTrace, isPending: deleting } = useDeleteTrace();

  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [maxJobs, setMaxJobs] = useState<number | "">("");
  const [uploadError, setUploadError] = useState("");
  const [selectedFileLabel, setSelectedFileLabel] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkloadTraceSummary | null>(null);

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setSelectedFileLabel(null); return; }
    setSelectedFileLabel(file.name);
    setName(traceNameFromFileName(file.name));
    setUploadError("");
  };

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Please select a .swf file");
      toast.error("Select a trace file first");
      return;
    }
    const n = name.trim() || traceNameFromFileName(file.name);
    if (!n) { setUploadError("Trace name is required"); return; }
    setUploadError("");

    uploadTrace(
      { file, name: n, maxJobs: maxJobs !== "" ? Number(maxJobs) : undefined },
      {
        onSuccess: () => {
          toast.success("Trace uploaded — parsing started");
          setName("");
          setMaxJobs("");
          setSelectedFileLabel(null);
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: (err) => {
          const msg = formatApiError(err);
          setUploadError(msg);
          toast.error(msg);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteTrace(pendingDelete.id, {
      onSuccess: () => { toast.success("Trace deleted"); setPendingDelete(null); },
      onError: (err) => { toast.error(formatApiError(err)); },
    });
  };

  const columns: ColumnDef<WorkloadTraceSummary>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-foreground">{row.original.name ?? row.original.id}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <TraceStatusCell trace={row.original} />,
      filterFn: (row, columnId, filterValue) =>
        !filterValue || filterValue === "all" || row.getValue(columnId) === filterValue,
    },
    {
      id: "jobs",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Jobs" />,
      cell: ({ row }) => <TraceJobCountCell trace={row.original} />,
    },
    {
      id: "uploaded",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
      cell: ({ row }) => {
        const iso = traceCreatedAtIso(row.original);
        return (
          <span className="text-muted-foreground">
            {iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
          </span>
        );
      },
    },
    {
      id: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 12)}…</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setPendingDelete(row.original)}
          aria-label={`Delete trace ${row.original.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload workload trace</CardTitle>
            <CardDescription>
              Upload an SWF (Standard Workload Format) file. The backend parses it asynchronously — status updates live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}

            <div>
              <label className="native-label" htmlFor="trace-name-input">Trace name</label>
              <input
                id="trace-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Auto-filled from file name"
                className="native-field"
              />
            </div>

            <div>
              <label className="native-label">Max jobs <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input
                type="number"
                value={maxJobs}
                onChange={(e) => setMaxJobs(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                placeholder="Leave empty to import all"
                min={1}
                className="native-field"
              />
              <p className="mt-1 text-xs text-muted-foreground">Limit jobs to speed up parsing on large traces.</p>
            </div>

            <div>
              <label className="native-label">SWF file</label>
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
                role="button"
                tabIndex={0}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                {selectedFileLabel ? (
                  <>
                    <p className="text-sm font-medium text-primary">{selectedFileLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Click to change file</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground">Click to select a <code className="text-xs">.swf</code> file</p>
                    <p className="mt-1 text-xs text-muted-foreground">Standard Workload Format only</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".swf,.txt,application/octet-stream"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <Button type="button" className="w-full" onClick={handleUpload} disabled={isPending}>
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? "Uploading…" : "Upload & parse"}
            </Button>
          </CardContent>
        </Card>

        {/* SWF format hint card */}
        <Card className="border-border/60 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-primary" />
              About SWF files
            </CardTitle>
            <CardDescription>
              What to upload and what the parser does with it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
            <p>
              SWF (<span className="text-foreground">Standard Workload Format</span>) is a plain-text log of real HPC
              jobs — each line is one job with fields like submission time, runtime, and CPU count.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Lines starting with <code className="rounded bg-muted px-1 text-xs text-foreground">;</code> are
                comments and are ignored.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Jobs with zero or negative runtime / CPU count are automatically skipped.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Set a <strong className="text-foreground">Max jobs</strong> limit to import only a portion of the trace — useful for quick testing on large files.
              </li>
            </ul>
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
              Sample traces are included: <code className="text-foreground">HPC2N.swf</code>,{" "}
              <code className="text-foreground">SDSC-SP2.swf</code>,{" "}
              <code className="text-foreground">lublin_256.swf</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traces table */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded traces</CardTitle>
          <CardDescription>Traces with status <strong>Ready</strong> can be used in simulations and benchmarks.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> Backend unreachable
            </div>
          )}
          {!isLoading && !error && (
            <>
              {(traces ?? []).length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No traces uploaded yet"
                  description="Upload an SWF file above to get started. Parsing runs in the background."
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={traces ?? []}
                  emptyMessage="No traces found."
                  globalFilterPlaceholder="Search by name or ID…"
                  filterBar={(table) => (
                    <select
                      className="native-field h-9 max-w-[140px] text-sm"
                      aria-label="Filter by status"
                      value={(table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all"}
                      onChange={(e) => {
                        const v = e.target.value;
                        table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v);
                      }}
                    >
                      <option value="all">All statuses</option>
                      <option value="ready">Ready</option>
                      <option value="processing">Processing</option>
                      <option value="failed">Failed</option>
                    </select>
                  )}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDangerDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete workload trace?"
        description={
          pendingDelete ? (
            <>
              Remove <strong className="text-foreground">{pendingDelete.name}</strong> from the server. Simulations and
              benchmarks referencing it may break.
            </>
          ) : null
        }
        confirmLabel="Delete trace"
        onConfirm={confirmDelete}
        isPending={deleting}
      />
    </div>
  );
}
