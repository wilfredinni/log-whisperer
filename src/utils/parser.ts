import * as vscode from "vscode";
import { LogEntry } from "../models/types";

export interface ParseProgress {
  entries: LogEntry[];
  isDone: boolean;
  progress: number;
}

const CHUNK_SIZE = 32 * 1024; // 32KB chunks

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

      const match = line.match(
        /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+([\w.]+)\s+(\w+)\s+(.+)$/
      );
      if (match) {
        const [, timestamp, logger, level, message] = match;
        entries.push({
          timestamp,
          logger,
          level,
          message,
          raw: line,
          filePath,
          lineNumber
        });
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
    const match = buffer.match(
      /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+([\w.]+)\s+(\w+)\s+(.+)$/
    );
    if (match) {
      const [, timestamp, logger, level, message] = match;
      entries.push({
        timestamp,
        logger,
        level,
        message,
        raw: buffer,
        filePath,
        lineNumber
      });
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
    case "error":
      return "#ff0000";
    case "warning":
      return "#ffa500";
    case "info":
      return "#00ff00";
    default:
      return "#ffffff";
  }
}
