export interface LogEntry {
    timestamp: string;
    level: string;
    logger: string;
    message: string;
    raw: string;
    filePath?: string;
}

export interface LogStats {
    totalEntries: number;
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

export type WebviewMessageCommand = 'filterLogs' | 'clearFilters' | 'selectFolder' | 'expandLogFile' | 'collapseLogFile' | 'openLog' | 'openLogFile' | 'refresh';

export interface WebviewMessage {
    command: WebviewMessageCommand;
    level?: string;
    logger?: string;
    path?: string;
    type?: string;
}