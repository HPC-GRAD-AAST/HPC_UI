import { useState, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Upload, Trash2, RefreshCw, AlertCircle, FileText, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useTraces, useUploadTrace, useDeleteTrace, useTraceStatus } from "../lib/hooks";
import {
  type WorkloadTraceShort,
  type WorkloadTraceSummary,
  formatTraceJobCount,
  traceCreatedAtIso,
} from "../lib/api";
import { formatApiError } from "../lib/api-errors";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ConfirmDangerDialog } from "./ui/confirm-danger-dialog";

const STATUS_META: Record<string, { icon: LucideIcon; row: string; badge: string }> = {
  processing: {
    icon: RefreshCw,
    row: "border-sky-500/25 bg-sky-500/5",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  ready: {
    icon: CheckCircle,
    row: "border-emerald-500/25 bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  failed: {
    icon: XCircle,
    row: "border-destructive/30 bg-destructive/5",
    badge: "bg-destructive/15 text-destructive",
  },
};

/** Strip extension for default trace name (e.g. HPC2N.swf → HPC2N). */
function traceNameFromFileName(filename: string): string {
  const t = filename.trim();
  if (!t) return "";
  const base = t.replace(/\.[^/.]+$/, "");
  return base || t;
}

function TraceRow({ trace, onDeleteClick }: { trace: WorkloadTraceSummary; onDeleteClick: () => void }) {
  const { data: live } = useTraceStatus(trace.id);
  const current = live ?? trace;
  const meta = STATUS_META[current.status] ?? STATUS_META["processing"];
  const Icon = meta.icon;

  return (
    <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${meta.row}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{current.name ?? trace.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${meta.badge}`}
          >
            <Icon className={`h-3 w-3 ${current.status === "processing" ? "animate-spin" : ""}`} />
            {current.status}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDeleteClick}
            aria-label={`Delete trace ${current.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Jobs: </span>
          <span className="text-foreground">{formatTraceJobCount(current)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ID: </span>
          <span className="font-mono text-xs text-muted-foreground">{trace.id.slice(0, 12)}…</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Uploaded: </span>
          <span className="text-foreground">
            {traceCreatedAtIso(trace) ? new Date(traceCreatedAtIso(trace)).toLocaleString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
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
    if (!file) {
      setSelectedFileLabel(null);
      return;
    }
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
    if (!n) {
      setUploadError("Trace name is required");
      return;
    }
    setUploadError("");

    uploadTrace(
      { file, name: n, maxJobs: maxJobs !== "" ? Number(maxJobs) : undefined },
      {
        onSuccess: () => {
          toast.success("Trace uploaded; parsing started");
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
      onSuccess: () => {
        toast.success("Trace deleted");
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(formatApiError(err));
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload workload trace</CardTitle>
          <CardDescription>
            Upload an SWF (Standard Workload Format) trace. The backend parses it asynchronously.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          {uploadError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="native-label" htmlFor="trace-name-input">
                Trace name
              </label>
              <input
                id="trace-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Filled from the file name when you pick a file"
                className="native-field"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Defaults to the file name (without extension) when you select a file.
              </p>
            </div>

            <div>
              <label className="native-label">Max jobs (optional)</label>
              <input
                type="number"
                value={maxJobs}
                onChange={(e) => setMaxJobs(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                placeholder="Leave empty to import all"
                min={1}
                className="native-field"
              />
              <p className="mt-1 text-xs text-muted-foreground">Limiting jobs speeds up parsing for large traces.</p>
            </div>

            <div>
              <label className="native-label">SWF file</label>
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-foreground">Click to select a .swf file</p>
                {selectedFileLabel ? (
                  <p className="mt-2 text-xs font-medium text-primary">Selected: {selectedFileLabel}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Standard Workload Format only</p>
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
          </div>

          <div className="mt-6 space-y-1 rounded-lg border border-border/60 bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">SWF format notes</p>
            <p>• Lines starting with <code className="rounded bg-muted px-1">;</code> are comments</p>
            <p>• Fields: job_id, submit, wait, run, cpus, mem, …</p>
            <p>• Jobs with run_time ≤ 0 or cpus ≤ 0 are skipped</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded traces</CardTitle>
          <CardDescription>Traces ready to use in experiment configurations</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && <div className="py-10 text-center text-muted-foreground">Loading…</div>}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /> Backend unreachable
            </div>
          )}

          <div className="max-h-[520px] space-y-3 overflow-y-auto">
            {(traces ?? []).map((trace) => (
              <TraceRow key={trace.id} trace={trace} onDeleteClick={() => setPendingDelete(trace)} />
            ))}
            {!isLoading && !error && (traces ?? []).length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p>No traces uploaded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDangerDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete workload trace?"
        description={
          pendingDelete ? (
            <>
              Remove <strong className="text-foreground">{pendingDelete.name}</strong> from the server. Experiments
              referencing it may break.
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
