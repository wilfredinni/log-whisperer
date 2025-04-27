import * as vscode from "vscode";
import { LogEntry } from "../models/types";

export interface ParseProgress {
  entries: LogEntry[];
  isDone: boolean;
  progress: number;
}

const CHUNK_SIZE = 32 * 1024; // 32KB chunks
const LOG_PATTERN =
  /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+([\w.]+)\s+(\w+)\s+(.+)$/;

export async function* parseLogFileStream(
  uri: vscode.Uri
): AsyncGenerator<ParseProgress> {
  const fileContent = await vscode.workspace.fs.readFile(uri);
  const textDecoder = new TextDecoder();
  let buffer = "";
  let bytesProcessed = 0;
  const totalBytes = fileContent.length;
  const entries: LogEntry[] = [];
  const filePath = uri.fsPath;
  let lineNumber = 0;

  // Track current entry for multiline appending
  let currentEntry: LogEntry | null = null;

  for (let i = 0; i < fileContent.length; i += CHUNK_SIZE) {
    const chunk = fileContent.slice(i, i + CHUNK_SIZE);
    buffer += textDecoder.decode(chunk, { stream: true });

    const lines = buffer.split("\n");
    // Keep the last line in buffer as it might be incomplete
    buffer = lines.pop() || "";

    for (const line of lines) {
      lineNumber++;
      if (!line.trim()) {
        continue;
      }

      const match = line.match(LOG_PATTERN);
      if (match) {
        // This is a new log entry
        const [, timestamp, logger, level, message] = match;
        currentEntry = {
          timestamp,
          logger,
          level,
          message,
          raw: line,
          filePath,
          lineNumber,
        };
        entries.push(currentEntry);
      } else if (currentEntry) {
        // This is a continuation line of the current entry
        // Append to the raw content and maintain the original message
        currentEntry.raw += "\n" + line;
      }
    }

    bytesProcessed = i + chunk.length;
    yield {
      entries: [...entries], // Return a copy of current entries
      isDone: false,
      progress: Math.round((bytesProcessed / totalBytes) * 100),
    };
  }

  // Process any remaining content in the buffer
  if (buffer) {
    lineNumber++;
    const match = buffer.match(LOG_PATTERN);
    if (match) {
      const [, timestamp, logger, level, message] = match;
      entries.push({
        timestamp,
        logger,
        level,
        message,
        raw: buffer,
        filePath,
        lineNumber,
      });
    } else if (currentEntry) {
      // Append remaining buffer to the current entry if it's not a new log
      currentEntry.raw += "\n" + buffer;
    }
  }

  yield {
    entries,
    isDone: true,
    progress: 100,
  };
}

export function getLogLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "fatal":
      return "#ff0000"; // Bright red for fatal errors
    case "error":
      return "#ff4444"; // Standard red for errors
    case "warning":
      return "#ffa500"; // Orange for warnings
    case "info":
      return "#00ff00"; // Green for info
    case "debug":
      return "#00ffff"; // Cyan for debug
    case "trace":
      return "#ff00ff"; // Magenta for trace
    default:
      return "#ffffff";
  }
}
