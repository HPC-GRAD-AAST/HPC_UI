/** Backend uses mebibytes (1024-based), labeled MB/GiB in UI as industry norm. */

export type MemoryUnit = "MB" | "GB" | "TB";

const MB_PER_GB = 1024;
const MB_PER_TB = 1024 * 1024;

export function mbToUnit(mb: number, unit: MemoryUnit): number {
  if (!Number.isFinite(mb)) return 0;
  switch (unit) {
    case "MB":
      return Math.round(mb);
    case "GB":
      return Math.round((mb / MB_PER_GB) * 1000) / 1000;
    case "TB":
      return Math.round((mb / MB_PER_TB) * 100000) / 100000;
    default:
      return mb;
  }
}

export function mbFromUnit(amount: number, unit: MemoryUnit): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  switch (unit) {
    case "MB":
      return Math.round(amount);
    case "GB":
      return Math.round(amount * MB_PER_GB);
    case "TB":
      return Math.round(amount * MB_PER_TB);
    default:
      return Math.round(amount);
  }
}

export function snapMemMb(mb: number, minMb: number, maxMb: number, stepMb = 256): number {
  const stepped = Math.round(mb / stepMb) * stepMb;
  return Math.min(maxMb, Math.max(minMb, stepped));
}

export function formatMemSummary(mb: number): string {
  if (!Number.isFinite(mb) || mb <= 0) return "0 MB";
  if (mb < MB_PER_GB) return `${Math.round(mb)} MB`;
  if (mb < MB_PER_TB) {
    const g = mb / MB_PER_GB;
    return g >= 100 ? `${Math.round(g)} GB` : `${Math.round(g * 10) / 10} GB`;
  }
  const t = mb / MB_PER_TB;
  return t >= 100 ? `${Math.round(t)} TB` : `${Math.round(t * 1000) / 1000} TB`;
}

export function unitsForMax(maxMb: number): MemoryUnit[] {
  if (maxMb >= MB_PER_TB) return ["MB", "GB", "TB"];
  return ["MB", "GB"];
}

export function inputStepForUnit(unit: MemoryUnit): string {
  switch (unit) {
    case "MB":
      return "256";
    case "GB":
      return "0.25";
    case "TB":
      return "0.0625";
    default:
      return "1";
  }
}
