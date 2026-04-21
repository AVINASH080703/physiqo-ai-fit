/**
 * Generic, type-safe data-access layer over Supabase.
 *
 * Works for any table in the public schema. Provides CRUD with filters,
 * pagination, sorting, and search. All errors are normalized and logged.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertRow<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateRow<T extends TableName> = Database["public"]["Tables"][T]["Update"];

export interface ListOptions<T extends TableName> {
  /** Equality filters: { column: value } */
  filters?: Partial<Record<keyof Row<T>, unknown>>;
  /** Free-text search: { column: "term" } — uses ILIKE %term% */
  search?: Partial<Record<keyof Row<T>, string>>;
  /** Sort column */
  orderBy?: keyof Row<T>;
  ascending?: boolean;
  /** 1-based page index */
  page?: number;
  pageSize?: number;
  /** Restrict to a user_id (if column exists) */
  userId?: string;
  /** Optional select clause; defaults to "*" */
  select?: string;
}

export interface ListResult<T> {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class DbError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "DbError";
  }
}

const log = (op: string, table: string, extra?: unknown) => {
  // eslint-disable-next-line no-console
  console.debug(`[db:${op}] ${table}`, extra ?? "");
};

const handle = <T,>(op: string, table: string, p: Promise<{ data: T | null; error: { code?: string; message: string } | null; count?: number | null }>) =>
  p.then(({ data, error, count }) => {
    if (error) {
      console.error(`[db:${op}] ${table} failed`, error);
      throw new DbError(error.code ?? "unknown", error.message, error);
    }
    return { data: data as T, count: count ?? 0 };
  });

export async function getAll<T extends TableName>(table: T, opts: ListOptions<T> = {}): Promise<ListResult<Row<T>>> {
  const { filters, search, orderBy, ascending = false, page = 1, pageSize = 20, userId, select = "*" } = opts;
  log("list", table, opts);

  let q = supabase.from(table).select(select, { count: "exact" });

  if (userId) q = q.eq("user_id" as never, userId as never);
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null || v === "") continue;
      q = q.eq(k as never, v as never);
    }
  }
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      if (!v) continue;
      q = q.ilike(k as never, `%${v}%` as never);
    }
  }
  if (orderBy) q = q.order(orderBy as string, { ascending });

  const from = (page - 1) * pageSize;
  q = q.range(from, from + pageSize - 1);

  const { data, count } = await handle<Row<T>[]>("list", table, q as never);
  return {
    rows: data ?? [],
    count,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
  };
}

export async function getById<T extends TableName>(table: T, id: string, idColumn: keyof Row<T> = "id" as keyof Row<T>): Promise<Row<T> | null> {
  log("get", table, { id });
  const { data } = await handle<Row<T> | null>(
    "get",
    table,
    supabase.from(table).select("*").eq(idColumn as never, id as never).maybeSingle() as never,
  );
  return data;
}

export async function createRecord<T extends TableName>(table: T, values: InsertRow<T>): Promise<Row<T>> {
  log("create", table);
  const { data } = await handle<Row<T>>(
    "create",
    table,
    supabase.from(table).insert(values as never).select().single() as never,
  );
  return data;
}

export async function updateRecord<T extends TableName>(table: T, id: string, values: UpdateRow<T>, idColumn: keyof Row<T> = "id" as keyof Row<T>): Promise<Row<T>> {
  log("update", table, { id });
  const { data } = await handle<Row<T>>(
    "update",
    table,
    supabase.from(table).update(values as never).eq(idColumn as never, id as never).select().single() as never,
  );
  return data;
}

export async function deleteRecord<T extends TableName>(table: T, id: string, idColumn: keyof Row<T> = "id" as keyof Row<T>): Promise<void> {
  log("delete", table, { id });
  const { error } = await supabase.from(table).delete().eq(idColumn as never, id as never);
  if (error) {
    console.error(`[db:delete] ${table} failed`, error);
    throw new DbError(error.code ?? "unknown", error.message, error);
  }
}

export { DbError };
