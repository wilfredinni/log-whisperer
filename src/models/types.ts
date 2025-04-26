export interface LogEntry {
    timestamp: string;
    level: string;
    logger: string;
    message: string;
    raw: string;
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

export interface WebviewMessage {
    command: 'filterLogs' | 'clearFilters';
    level?: string;
    logger?: string;
}