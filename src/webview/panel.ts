import * as vscode from "vscode";
import * as path from "path";
import {
  LogEntry,
  LogStats,
  LogFilters,
  WebviewMessage,
} from "../models/types";
import { getWebviewContent } from "./content";

export class LogViewerPanel {
  private panel: vscode.WebviewPanel;
  private allLogs: LogEntry[];
  private currentLogs: LogEntry[];
  private filters: LogFilters = { level: "", logger: "" };
  private readonly CHUNK_SIZE = 1000;

  constructor(
    context: vscode.ExtensionContext,
    logs: LogEntry[],
    fileName: string
  ) {
    this.allLogs = [...logs];
    this.currentLogs = this.allLogs;

    this.panel = vscode.window.createWebviewPanel(
      "logWhisperer",
      `Log Viewer - ${path.basename(fileName)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.setupMessageHandling(context);
    this.updateWebview();
  }

  private setupMessageHandling(context: vscode.ExtensionContext) {
    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        switch (message.command) {
          case "filterLogs":
            if (
              typeof message.level === "string" ||
              typeof message.logger === "string"
            ) {
              this.filters = {
                level:
                  typeof message.level === "string"
                    ? message.level
                    : this.filters.level,
                logger:
                  typeof message.logger === "string"
                    ? message.logger
                    : this.filters.logger,
              };
              await this.applyFiltersAsync();
            }
            break;
          case "clearFilters":
            this.filters = { level: "", logger: "" };
            this.currentLogs = this.allLogs;
            this.updateWebview();
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    // Clean up when the panel is disposed
    this.panel.onDidDispose(
      () => {
        // Cleanup
      },
      null,
      context.subscriptions
    );
  }

  private async applyFiltersAsync() {
    const startTime = Date.now();
    let filteredLogs: LogEntry[] = [];

    // Process logs in chunks to avoid blocking the UI
    for (let i = 0; i < this.allLogs.length; i += this.CHUNK_SIZE) {
      const chunk = this.allLogs.slice(i, i + this.CHUNK_SIZE);
      const filteredChunk = chunk.filter((log) => {
        const levelMatch =
          !this.filters.level || log.level === this.filters.level;
        const loggerMatch =
          !this.filters.logger || log.logger === this.filters.logger;
        return levelMatch && loggerMatch;
      });

      filteredLogs = filteredLogs.concat(filteredChunk);

      // Every 100ms, update the UI with progress
      if (Date.now() - startTime > 100) {
        this.currentLogs = filteredLogs;
        const progress = Math.round((i / this.allLogs.length) * 100);
        this.updateWebviewWithProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, 0)); // Let UI breathe
      }
    }

    this.currentLogs = filteredLogs;
    this.updateWebview();
  }

  private updateWebviewWithProgress(progress: number) {
    // Calculate stats for currently filtered logs
    const stats = this.calculateStats();
    stats.totalEntries = `${this.currentLogs.length} (Filtering: ${progress}%)`;
    this.panel.webview.postMessage({
      command: "updateLogs",
      logs: this.currentLogs,
      stats,
      filters: this.filters,
    });
  }

  private calculateStats(): LogStats {
    const stats: LogStats = {
      totalEntries: this.currentLogs.length,
      byLevel: {} as Record<string, number>,
      byLogger: {} as Record<string, number>,
      allLevels: [...new Set(this.allLogs.map((log) => log.level))],
      allLoggers: [...new Set(this.allLogs.map((log) => log.logger))],
    };

    // Process stats in chunks to avoid blocking
    for (let i = 0; i < this.currentLogs.length; i += this.CHUNK_SIZE) {
      const chunk = this.currentLogs.slice(i, i + this.CHUNK_SIZE);
      chunk.forEach((log) => {
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        stats.byLogger[log.logger] = (stats.byLogger[log.logger] || 0) + 1;
      });
    }

    return stats;
  }

  private updateWebview() {
    const stats = this.calculateStats();
    this.panel.webview.html = getWebviewContent(
      this.currentLogs,
      stats,
      this.filters
    );
  }
}
