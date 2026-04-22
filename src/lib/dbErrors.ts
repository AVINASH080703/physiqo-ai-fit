/**
 * Maps internal DB/PostgREST error codes to safe, user-facing messages.
 * Avoids leaking schema, column, or constraint names to the UI.
 */
const FRIENDLY: Record<string, string> = {
  "23505": "That record already exists.",
  "23503": "Related record is missing or in use.",
  "23502": "A required field is missing.",
  "23514": "Some values are not allowed.",
  "22P02": "Invalid value provided.",
  "42501": "You don't have permission to do that.",
  "PGRST301": "You don't have permission to do that.",
  "PGRST116": "Record not found.",
};

interface MaybeDbError {
  code?: string;
  message?: string;
}

export function friendlyDbError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  // Always log full details for developers.
  // eslint-disable-next-line no-console
  console.error("[db error]", err);
  const e = err as MaybeDbError;
  if (e?.code && FRIENDLY[e.code]) return FRIENDLY[e.code];
  return fallback;
}
