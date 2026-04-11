/**
 * Minimal structured logger.
 *
 * Writes one JSON object per line to stdout so it can be ingested by log
 * aggregators (Vercel Logs, Datadog, etc.) without a parser. We deliberately
 * avoid a heavy dependency like pino here — this file has no runtime deps.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("property_updated", { propertyId: id, userId });
 *   logger.error("matching_failed", err, { propertyId: id });
 *
 * In test or development, the output is human-readable unless LOG_JSON=true.
 */

type Level = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const LEVEL_VALUE: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): number {
  const raw = (process.env.LOG_LEVEL || "").toLowerCase() as Level;
  if (raw in LEVEL_VALUE) return LEVEL_VALUE[raw];
  return process.env.NODE_ENV === "production" ? LEVEL_VALUE.info : LEVEL_VALUE.debug;
}

function shouldLog(level: Level): boolean {
  return LEVEL_VALUE[level] >= currentLevel();
}

function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      err_name: err.name,
      err_message: err.message,
      err_stack: err.stack,
    };
  }
  return { err_value: String(err) };
}

function emit(level: Level, event: string, fields: LogFields) {
  if (!shouldLog(level)) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };

  const isJson =
    process.env.LOG_JSON === "true" || process.env.NODE_ENV === "production";

  if (isJson) {
    // Single-line JSON for machine ingestion
    try {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(record));
    } catch {
      // Circular reference or similar — fall back to key=value
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${event}`, fields);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${event}`, fields);
  }
}

export const logger = {
  debug(event: string, fields: LogFields = {}) {
    emit("debug", event, fields);
  },
  info(event: string, fields: LogFields = {}) {
    emit("info", event, fields);
  },
  warn(event: string, fields: LogFields = {}) {
    emit("warn", event, fields);
  },
  error(event: string, err: unknown, fields: LogFields = {}) {
    emit("error", event, { ...fields, ...serializeError(err) });
  },
};
