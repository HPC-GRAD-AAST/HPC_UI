import { useState, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Upload, Trash2, RefreshCw, AlertCircle, FileText, CheckCircle, XCircle } from "lucide-react";
import { useTraces, useUploadTrace, useDeleteTrace, useTraceStatus } from "../lib/hooks";
import { WorkloadTraceShort } from "../lib/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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

function TraceRow({ trace, onDelete }: { trace: WorkloadTraceShort; onDelete: () => void }) {
  const { data: live } = useTraceStatus(trace.id);
  const current = live ?? trace;
  const meta = STATUS_META[current.status] ?? STATUS_META["processing"];
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-md ${meta.row}`}
    >
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
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Jobs: </span>
          <span className="text-foreground">{current.job_count ?? "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ID: </span>
          <span className="font-mono text-xs text-muted-foreground">{trace.id.slice(0, 12)}…</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Uploaded: </span>
          <span className="text-foreground">{new Date(trace.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export function WorkloadTraceManager() {
  const { data: traces, isLoading, error } = useTraces();
  const { mutate: uploadTrace, isPending } = useUploadTrace();
  const { mutate: deleteTrace } = useDeleteTrace();

  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [maxJobs, setMaxJobs] = useState<number | "">("");
  const [uploadError, setUploadError] = useState("");

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setUploadError("Please select a .swf file"); return; }
    if (!name.trim()) { setUploadError("Trace name is required"); return; }
    setUploadError("");

    uploadTrace(
      { file, name: name.trim(), maxJobs: maxJobs !== "" ? Number(maxJobs) : undefined },
      {
        onSuccess: () => {
          setName("");
          setMaxJobs("");
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: () => setUploadError("Upload failed. Check the backend logs."),
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Workload Trace</CardTitle>
          <CardDescription>
            Upload an SWF (Standard Workload Format) trace file. The backend will parse it asynchronously.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-0">
        {uploadError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {uploadError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="native-label">Trace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., SDSC-SP2-1998"
              className="native-field"
            />
          </div>

          <div>
            <label className="native-label">Max Jobs (optional)</label>
            <input
              type="number"
              value={maxJobs}
              onChange={(e) => setMaxJobs(e.target.value === "" ? "" : parseInt(e.target.value))}
              placeholder="Leave empty to import all"
              min="1"
              className="native-field"
            />
            <p className="mt-1 text-xs text-muted-foreground">Limiting jobs speeds up parsing for large traces.</p>
          </div>

          <div>
            <label className="native-label">SWF File</label>
            <div
              className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-foreground">Click to select a .swf file</p>
              <p className="mt-1 text-xs text-muted-foreground">Standard Workload Format only</p>
              <input ref={fileRef} type="file" accept=".swf,.txt" className="hidden" />
            </div>
          </div>

          <Button className="w-full" onClick={handleUpload} disabled={isPending}>
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isPending ? "Uploading…" : "Upload & Parse"}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-1 border border-border/60">
          <p className="font-medium text-foreground">SWF Format Notes</p>
          <p>• Lines starting with <code className="bg-muted px-1 rounded">;</code> are comments</p>
          <p>• Fields: job_id, submit, wait, run, cpus, mem, …</p>
          <p>• Jobs with run_time ≤ 0 or cpus ≤ 0 are skipped</p>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Traces</CardTitle>
          <CardDescription>Traces ready to use in Experiment configurations</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
        {isLoading && <div className="text-muted-foreground text-center py-10">Loading…</div>}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" /> Backend unreachable
          </div>
        )}

        <div className="space-y-3 max-h-[520px] overflow-y-auto">
          {(traces ?? []).map((trace) => (
            <TraceRow key={trace.id} trace={trace} onDelete={() => deleteTrace(trace.id)} />
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
    </div>
  );
}
