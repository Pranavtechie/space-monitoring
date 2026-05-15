import { useMemo, useState } from "react";
import type { AppRouter } from "@app/api/routers/index";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
} from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/university-orgs")({
  staticData: {
    title: "University Orgs",
  },
  component: UniversityOrgsComponent,
});

type OrgRow = inferRouterOutputs<AppRouter>["organization"]["list"][number];

const RELEVANCE_ORDER: Record<string, number> = {
  Direct: 0,
  "Strongly Adjacent": 1,
  "Loosely Adjacent": 2,
};

const columns: ColumnDef<OrgRow>[] = [
  {
    accessorKey: "name",
    header: "Organization",
    cell: ({ row }) => {
      const { name, website } = row.original;
      return website ? (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-1.5 font-medium hover:text-cyan-500"
        >
          {name}
          <ExternalLink className="size-3 shrink-0 text-muted-foreground/50 group-hover:text-cyan-500" />
        </a>
      ) : (
        <span className="font-medium">{name}</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "institutionName",
    header: "University",
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
  },
  {
    accessorKey: "category",
    header: "Category",
    enableSorting: true,
  },
  {
    accessorKey: "relevance",
    header: "Relevance",
    cell: ({ getValue }) => {
      const val = getValue<string>();
      const cls =
        val === "Direct"
          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
          : val === "Strongly Adjacent"
            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            : "bg-muted text-muted-foreground";
      return (
        <span
          className={`rounded-none px-1.5 py-0.5 text-xs font-medium ${cls}`}
        >
          {val}
        </span>
      );
    },
    sortingFn: (a, b) => {
      const av = RELEVANCE_ORDER[a.original.relevance] ?? 99;
      const bv = RELEVANCE_ORDER[b.original.relevance] ?? 99;
      return av - bv;
    },
    enableSorting: true,
  },
];

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted)
    return <ChevronsUpDown className="size-3 text-muted-foreground/50" />;
  return sorted === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  );
}

function UniversityOrgsComponent() {
  const trpc = useTRPC();
  const { data = [], isLoading } = useQuery(
    trpc.organization.list.queryOptions(),
  );

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "relevance", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);

  const universities = useMemo(
    () => [...new Set(data.map((r) => r.institutionName))].sort(),
    [data],
  );
  const types = useMemo(
    () => [...new Set(data.map((r) => r.type).filter(Boolean))].sort(),
    [data],
  );
  const categories = useMemo(
    () => [...new Set(data.map((r) => r.category).filter(Boolean))].sort(),
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, sorting, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  // keep page size in sync when dropdown changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    table.setPageSize(size);
  };

  const activeUniversity =
    (columnFilters.find((f) => f.id === "institutionName")?.value as string) ??
    "";
  const activeType =
    (columnFilters.find((f) => f.id === "type")?.value as string) ?? "";
  const activeCategory =
    (columnFilters.find((f) => f.id === "category")?.value as string) ?? "";
  const activeRelevance =
    (columnFilters.find((f) => f.id === "relevance")?.value as string) ?? "";

  const setFilter = (id: string, value: string) => {
    setColumnFilters((prev) =>
      value
        ? [...prev.filter((f) => f.id !== id), { id, value }]
        : prev.filter((f) => f.id !== id),
    );
    table.setPageIndex(0);
  };

  return (
    <AppLayout>
      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">University Organizations</h1>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} of {data.length}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            className="h-8 min-w-48 border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
            placeholder="Search organizations…"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              table.setPageIndex(0);
            }}
          />
          <Select
            label="University"
            options={universities}
            value={activeUniversity}
            onChange={(v) => setFilter("institutionName", v)}
          />
          <Select
            label="Type"
            options={types}
            value={activeType}
            onChange={(v) => setFilter("type", v)}
          />
          <Select
            label="Category"
            options={categories}
            value={activeCategory}
            onChange={(v) => setFilter("category", v)}
          />
          <Select
            label="Relevance"
            options={["Direct", "Strongly Adjacent", "Loosely Adjacent"]}
            value={activeRelevance}
            onChange={(v) => setFilter("relevance", v)}
          />
          {(globalFilter || columnFilters.length > 0) && (
            <button
              className="h-8 border px-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setGlobalFilter("");
                setColumnFilters([]);
                table.setPageIndex(0);
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden border">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b px-4 py-3">
                  <div className="h-4 w-48 animate-pulse bg-muted" />
                  <div className="h-4 w-32 animate-pulse bg-muted" />
                  <div className="h-4 w-24 animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2.5 text-left font-medium text-muted-foreground"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No organizations match the current filters.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                className="h-7 border bg-background px-2 text-sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <div className="flex gap-1">
                <PageBtn
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  label="«"
                />
                <PageBtn
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  label="‹"
                />
                <PageBtn
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  label="›"
                />
                <PageBtn
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  label="»"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className="h-8 border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function PageBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      className="flex size-7 items-center justify-center border text-sm disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
