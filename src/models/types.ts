export interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  raw: string;
  filePath?: string;
  lineNumber: number;  // Track the actual line number in the file
}

export interface LogStats {
  totalEntries: number | string; // Can be string when showing progress
  byLevel: Record<string, number>;
  byLogger: Record<string, number>;
  allLevels: string[];
  allLoggers: string[];
}

export interface LogFilters {
  level: string;
  logger: string;
}

export interface LogFile {
  path: string;
  name: string;
  entries: LogEntry[];
  isExpanded?: boolean;
}

export interface LogExplorerState {
  currentFolder?: string;
  logFiles: LogFile[];
}

export type WebviewMessageCommand =
  | "filterLogs"
  | "clearFilters"
  | "selectFolder"
  | "expandLogFile"
  | "collapseLogFile"
  | "openLog"
  | "openLogFile"
  | "refresh"
  | "updateLogs";

export interface WebviewMessage {
  command: WebviewMessageCommand;
  level?: string;
  logger?: string;
  path?: string;
  type?: string;
  logs?: LogEntry[];
  stats?: LogStats;
  filters?: LogFilters;
  progress?: number;
  line?: number; // Added line number for file opening
}
