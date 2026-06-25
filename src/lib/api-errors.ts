import type { AxiosError } from "axios";

/** Turn FastAPI / axios errors into a single readable string. */
export function formatApiError(err: unknown): string {
  const ax = err as AxiosError<{ detail?: unknown }>;
  const d = ax.response?.data?.detail;
  if (d == null) return ax.message || "Request failed";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((x) =>
        typeof x === "object" && x !== null && "msg" in x
          ? String((x as { msg: string }).msg)
          : JSON.stringify(x),
      )
      .join("; ");
  }
  if (typeof d === "object" && d !== null && "message" in d) {
    const o = d as { message: string; errors?: string[] };
    return o.errors?.length ? `${o.message} — ${o.errors.join("; ")}` : o.message;
  }
  try {
    return JSON.stringify(d);
  } catch {
    return String(d);
  }
}
