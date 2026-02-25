import { query } from "@/lib/db";

export type ErrorLevel = "error" | "warn" | "info";

export interface LogEntry {
  level?: ErrorLevel;
  source?: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  url?: string;
  user_id?: number;
}

export async function logError(entry: LogEntry) {
  try {
    await query(
      `INSERT INTO error_logs (level, source, message, stack, context, url, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.level ?? "error",
        entry.source ?? "server",
        entry.message,
        entry.stack ?? null,
        JSON.stringify(entry.context ?? {}),
        entry.url ?? null,
        entry.user_id ?? null,
      ]
    );
  } catch {
    // Fail silently — logging should never break the app
    console.error("[logger] Failed to write error log:", entry.message);
  }
}

// Convenience wrappers
export const logger = {
  error: (message: string, extra?: Omit<LogEntry, "message" | "level">) =>
    logError({ ...extra, message, level: "error" }),
  warn: (message: string, extra?: Omit<LogEntry, "message" | "level">) =>
    logError({ ...extra, message, level: "warn" }),
  info: (message: string, extra?: Omit<LogEntry, "message" | "level">) =>
    logError({ ...extra, message, level: "info" }),
};
