import type { Table } from "@tanstack/react-table";

import type { SchedulerPolicy, SimulationStatus, SimulationSummary } from "../../lib/api";

const ALL_POLICIES: SchedulerPolicy[] = [
  "fcfs",
  "sjf",
  "priority",
  "roundrobin",
  "bestfit",
  "worstfit",
  "loadbalancing",
  "easybackfill",
  "rl",
];

const ALL_STATUSES: SimulationStatus[] = ["pending", "running", "done", "failed"];

function selectClass() {
  return "native-field h-9 max-w-[180px] min-w-0 text-sm";
}

/** Faceted filters for simulation DataTables (policy + status). */
export function SimulationTableFilters({ table }: { table: Table<SimulationSummary> }) {
  const policyCol = table.getColumn("policy");
  const statusCol = table.getColumn("status");

  const policyVal = (policyCol?.getFilterValue() as string | undefined) ?? "all";
  const statusVal = (statusCol?.getFilterValue() as string | undefined) ?? "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={selectClass()}
        aria-label="Filter by policy"
        value={policyVal === "" ? "all" : policyVal}
        onChange={(e) => {
          const v = e.target.value;
          policyCol?.setFilterValue(v === "all" ? undefined : v);
        }}
      >
        <option value="all">All policies</option>
        {ALL_POLICIES.map((p) => (
          <option key={p} value={p}>
            {p.toUpperCase()}
          </option>
        ))}
      </select>
      <select
        className={selectClass()}
        aria-label="Filter by status"
        value={statusVal === "" ? "all" : statusVal}
        onChange={(e) => {
          const v = e.target.value;
          statusCol?.setFilterValue(v === "all" ? undefined : v);
        }}
      >
        <option value="all">All statuses</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
