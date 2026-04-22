/**
 * Per-table typed service wrappers. Add new tables here as they're created.
 */
import { getAll, getById, createRecord, updateRecord, deleteRecord, ListOptions } from "./db";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

const make = <T extends keyof Tables>(name: T) => ({
  list: (opts?: ListOptions<T>) => getAll(name, opts),
  get: (id: string) => getById(name, id),
  create: (v: Tables[T]["Insert"]) => createRecord(name, v),
  update: (id: string, v: Tables[T]["Update"]) => updateRecord(name, id, v),
  remove: (id: string) => deleteRecord(name, id),
});

export const profilesService = make("profiles");
export const workoutPlansService = make("workout_plans");
export const bodyMetricsService = make("body_metrics");
export const foodItemsService = make("food_items");
export const exercisesService = make("exercises");
export const nutritionLogsService = make("nutrition_logs");
export const waterLogsService = make("water_logs");
export const exerciseLogsService = make("exercise_logs");
export const nutritionTargetsService = make("nutrition_targets");
export const userPreferencesService = make("user_preferences");
