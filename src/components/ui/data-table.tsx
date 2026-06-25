import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type Table,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { cn } from "./utils";

/** Match any primitive field on the row (IDs, enums, dates as strings). */
const globalTextFilter: FilterFn<unknown> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "").toLowerCase().trim();
  if (!q) return true;
  return Object.values(row.original as Record<string, unknown>).some((cell) =>
    String(cell ?? "").toLowerCase().includes(q),
  );
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  /** When rows exist but filters hide all of them */
  filteredEmptyMessage?: string;
  /** Default true */
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  /** Extra faceted filters (policy, status, …) */
  filterBar?: (table: Table<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No rows to display.",
  filteredEmptyMessage = "No rows match your filters.",
  enableGlobalFilter = true,
  globalFilterPlaceholder = "Search…",
  filterBar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalTextFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const showToolbar = enableGlobalFilter || !!filterBar;
  const rowCount = table.getRowModel().rows.length;
  const isFilteredOut = data.length > 0 && rowCount === 0;
  const isEmpty = data.length === 0;

  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {enableGlobalFilter && (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="ps-9"
                aria-label="Filter table"
              />
            </div>
          )}
          {filterBar?.(table)}
        </div>
      )}

      <UITable>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rowCount > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-border" data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">
                {isEmpty ? emptyMessage : filteredEmptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </UITable>
    </div>
  );
}

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "-ms-2 h-8 gap-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="size-3.5 shrink-0" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="size-3.5 shrink-0" />
      ) : (
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      )}
    </Button>
  );
}
