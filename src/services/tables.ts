/**
 * Per-table typed service wrappers. Add new tables here as they're created.
 */
import { getAll, getById, createRecord, updateRecord, deleteRecord, ListOptions } from "./db";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export const profilesService = {
  list: (opts?: ListOptions<"profiles">) => getAll("profiles", opts),
  get: (id: string) => getById("profiles", id),
  create: (v: Tables["profiles"]["Insert"]) => createRecord("profiles", v),
  update: (id: string, v: Tables["profiles"]["Update"]) => updateRecord("profiles", id, v),
  remove: (id: string) => deleteRecord("profiles", id),
};

export const workoutPlansService = {
  list: (opts?: ListOptions<"workout_plans">) => getAll("workout_plans", opts),
  get: (id: string) => getById("workout_plans", id),
  create: (v: Tables["workout_plans"]["Insert"]) => createRecord("workout_plans", v),
  update: (id: string, v: Tables["workout_plans"]["Update"]) => updateRecord("workout_plans", id, v),
  remove: (id: string) => deleteRecord("workout_plans", id),
};

export const bodyMetricsService = {
  list: (opts?: ListOptions<"body_metrics">) => getAll("body_metrics", opts),
  get: (id: string) => getById("body_metrics", id),
  create: (v: Tables["body_metrics"]["Insert"]) => createRecord("body_metrics", v),
  update: (id: string, v: Tables["body_metrics"]["Update"]) => updateRecord("body_metrics", id, v),
  remove: (id: string) => deleteRecord("body_metrics", id),
};
