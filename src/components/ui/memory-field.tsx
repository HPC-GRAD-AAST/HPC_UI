import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type MemoryUnit,
  mbFromUnit,
  mbToUnit,
  snapMemMb,
  unitsForMax,
  inputStepForUnit,
  formatMemSummary,
} from "@/lib/memory-units";
import { cn } from "./utils";

const STORAGE_KEY = "grad-ui-memory-unit-preference";

function readStoredUnit(allowed: MemoryUnit[]): MemoryUnit | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "MB" || v === "GB" || v === "TB") {
      if (allowed.includes(v)) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export interface MemoryFieldProps {
  /** Value in mebibytes (API / backend). */
  valueMb: number;
  onValueMbChange: (mb: number) => void;
  minMb?: number;
  maxMb?: number;
  stepMb?: number;
  label?: string;
  /** Range control; always uses MB steps (matches API). End labels show human-readable sizes. */
  showSlider?: boolean;
  /** Remember MB/GB/TB choice in localStorage. */
  persistUnitPreference?: boolean;
  className?: string;
  disabled?: boolean;
}

export function MemoryField({
  valueMb,
  onValueMbChange,
  minMb = 512,
  maxMb = 131_072,
  stepMb = 256,
  label = "Memory",
  showSlider = true,
  persistUnitPreference = true,
  className,
  disabled = false,
}: MemoryFieldProps) {
  const allowedUnits = useMemo(() => unitsForMax(maxMb), [maxMb]);

  const [unit, setUnit] = useState<MemoryUnit>(() => {
    const stored = readStoredUnit(allowedUnits);
    return stored ?? (allowedUnits.includes("GB") ? "GB" : "MB");
  });

  useEffect(() => {
    if (!allowedUnits.includes(unit)) {
      setUnit(allowedUnits.includes("GB") ? "GB" : "MB");
    }
  }, [allowedUnits, unit]);

  const setUnitAndPersist = useCallback(
    (u: MemoryUnit) => {
      setUnit(u);
      if (persistUnitPreference) {
        try {
          localStorage.setItem(STORAGE_KEY, u);
        } catch {
          /* ignore */
        }
      }
    },
    [persistUnitPreference],
  );

  const displayVal = mbToUnit(valueMb, unit);
  const summary = formatMemSummary(valueMb);

  const applyMb = useCallback(
    (mb: number) => {
      onValueMbChange(snapMemMb(mb, minMb, maxMb, stepMb));
    },
    [minMb, maxMb, stepMb, onValueMbChange],
  );

  const onNumberChange = (raw: string) => {
    if (raw === "" || raw === "-") return;
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return;
    applyMb(mbFromUnit(n, unit));
  };

  const sliderMb = snapMemMb(valueMb, minMb, maxMb, stepMb);

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <label className="native-label">{label}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step={inputStepForUnit(unit)}
            value={Number.isFinite(displayVal) ? displayVal : 0}
            onChange={(e) => onNumberChange(e.target.value)}
            disabled={disabled}
            className="native-field min-w-0 flex-1 font-variant-numeric tabular-nums"
          />
          <select
            value={unit}
            onChange={(e) => setUnitAndPersist(e.target.value as MemoryUnit)}
            disabled={disabled}
            className="native-field w-[5.5rem] shrink-0 text-sm"
            aria-label="Memory unit"
          >
            {allowedUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        ≈ <span className="font-medium text-foreground">{summary}</span> on the server (mebibytes)
      </p>
      {showSlider && (
        <div>
          <input
            type="range"
            min={minMb}
            max={maxMb}
            step={stepMb}
            value={sliderMb}
            onChange={(e) => applyMb(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="accent-primary w-full"
          />
          <div className="mt-1 flex justify-between gap-2 text-[10px] text-muted-foreground">
            <span className="truncate">{formatMemSummary(minMb)}</span>
            <span className="truncate text-end">{formatMemSummary(maxMb)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
