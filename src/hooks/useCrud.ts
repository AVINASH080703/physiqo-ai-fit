/**
 * Generic React Query hooks for any table — caching, loading, empty states.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAll, getById, createRecord, updateRecord, deleteRecord,
  ListOptions, Row, InsertRow, UpdateRow, TableName,
} from "@/services/db";
import { friendlyDbError } from "@/lib/dbErrors";

const key = (table: TableName, ...rest: unknown[]) => ["db", table, ...rest];

export function useList<T extends TableName>(table: T, opts: ListOptions<T> = {}) {
  return useQuery({
    queryKey: key(table, "list", opts),
    queryFn: () => getAll(table, opts),
    staleTime: 30_000,
  });
}

export function useRecord<T extends TableName>(table: T, id: string | undefined) {
  return useQuery({
    queryKey: key(table, "one", id),
    queryFn: () => getById(table, id!),
    enabled: !!id,
  });
}

export function useCreate<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: InsertRow<T>) => createRecord(table, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(table) });
      toast.success("Record created");
    },
    onError: (e) => toast.error(friendlyDbError(e, "Could not create record.")),
  });
}

export function useUpdate<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateRow<T> }) => updateRecord(table, id, values),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: key(table) });
      qc.setQueryData(key(table, "one", (row as { id: string }).id), row);
      toast.success("Record updated");
    },
    onError: (e) => toast.error(friendlyDbError(e, "Could not update record.")),
  });
}

export function useRemove<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecord(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(table) });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(friendlyDbError(e, "Could not delete record.")),
  });
}

export type { Row };
