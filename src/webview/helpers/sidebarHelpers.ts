import { LogEntry } from "../../models/types";

export interface LogSummary {
  total: number;
  errors: number;
  fatal: number;
  warnings: number;
  info: number;
  debug: number;
  trace: number;
  other: number;
}

export function calculateLogSummary(entries: LogEntry[]): LogSummary {
  const summary: LogSummary = {
    total: entries.length,
    fatal: 0,
    errors: 0,
    warnings: 0,
    info: 0,
    debug: 0,
    trace: 0,
    other: 0,
  };

  entries.forEach((entry) => {
    const level = entry.level.toLowerCase();
    if (level.includes("fatal")) {
      summary.fatal++;
    } else if (level.includes("error")) {
      summary.errors++;
    } else if (level.includes("warn")) {
      summary.warnings++;
    } else if (level.includes("info")) {
      summary.info++;
    } else if (level.includes("debug")) {
      summary.debug++;
    } else if (level.includes("trace")) {
      summary.trace++;
    } else {
      summary.other++;
    }
  });

  return summary;
}

export function getLogLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
      return "var(--vscode-errorForeground)";
    case "warning":
      return "var(--vscode-problemsWarningIcon-foreground)";
    case "info":
      return "var(--vscode-notificationsInfoIcon-foreground)";
    default:
      return "var(--vscode-foreground)";
  }
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}
