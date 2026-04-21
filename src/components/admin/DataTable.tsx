/**
 * Generic data table with search, sort, pagination, and row delete.
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useList, useRemove } from "@/hooks/useCrud";
import type { TableName, Row } from "@/services/db";

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface Props<T extends TableName> {
  table: T;
  columns: Column<Row<T>>[];
  /** Column to use for ILIKE search */
  searchColumn?: keyof Row<T> & string;
  /** Restrict to current user */
  userId?: string;
  /** Default sort column */
  defaultSort?: keyof Row<T> & string;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends TableName>({
  table, columns, searchColumn, userId, defaultSort, pageSize = 10, emptyMessage = "No records found.",
}: Props<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<string | undefined>(defaultSort);
  const [ascending, setAscending] = useState(false);

  const { data, isLoading, isError, error } = useList(table, {
    page, pageSize, userId,
    orderBy: orderBy as never,
    ascending,
    search: search && searchColumn ? ({ [searchColumn]: search } as never) : undefined,
  });
  const remove = useRemove(table);

  const toggleSort = (col: string) => {
    if (orderBy === col) setAscending((a) => !a);
    else { setOrderBy(col); setAscending(true); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {searchColumn && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search by ${searchColumn}…`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        )}
        <div className="ml-auto text-xs text-muted-foreground">
          {data ? `${data.count} record${data.count === 1 ? "" : "s"}` : ""}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>
                  {c.sortable !== false ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {c.label}
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                  ) : c.label}
                </TableHead>
              ))}
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((c) => <TableCell key={c.key}><Skeleton className="h-4 w-24" /></TableCell>)}
                <TableCell><Skeleton className="h-7 w-7 rounded ml-auto" /></TableCell>
              </TableRow>
            ))}
            {isError && (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-destructive py-8">
                {(error as Error)?.message || "Failed to load."}
              </TableCell></TableRow>
            )}
            {!isLoading && !isError && data?.rows.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-10">
                {emptyMessage}
              </TableCell></TableRow>
            )}
            {data?.rows.map((row) => (
              <TableRow key={(row as { id: string }).id}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    {c.render ? c.render(row) : formatValue((row as Record<string, unknown>)[c.key])}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate((row as { id: string }).id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v).slice(0, 40)}…</code>;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString();
  return String(v);
}
