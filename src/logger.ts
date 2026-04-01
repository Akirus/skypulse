type LogLevel = "info" | "error" | "warn";

function log(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export function logInfo(message: string, fields?: Record<string, unknown>): void {
  log("info", message, fields);
}

export function logWarn(message: string, fields?: Record<string, unknown>): void {
  log("warn", message, fields);
}

export function logError(message: string, fields?: Record<string, unknown>): void {
  log("error", message, fields);
}
