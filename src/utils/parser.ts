import { LogEntry } from "../models/types";

export function parseLogFile(content: string): LogEntry[] {
  const lines = content.split("\n");
  const logs: LogEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    // Match Django log format: TIMESTAMP LOGGER LEVEL MESSAGE
    const match = line.match(
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+([\w.]+)\s+(\w+)\s+(.+)$/
    );
    if (match) {
      const [, timestamp, logger, level, message] = match;
      logs.push({
        timestamp,
        logger,
        level,
        message,
        raw: line,
      });
    }
  }

  return logs;
}

export function getLogLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case "ERROR":
      return "#ff0000";
    case "WARNING":
      return "#ffa500";
    case "INFO":
      return "#00ff00";
    default:
      return "#ffffff";
  }
}
