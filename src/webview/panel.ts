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
  private filters: LogFilters = { level: "", logger: "", search: "" };
  private readonly CHUNK_SIZE = 1000;
  private isLoading: boolean = true;

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

  public updateEntries(entries: LogEntry[], isLoading: boolean = false) {
    this.allLogs = entries;
    this.isLoading = isLoading;
    if (!isLoading && entries.length > 0) {
      this.currentLogs = entries;
      this.updateWebview();
    } else {
      this.applyFiltersAsync(true); // true indicates this is a progressive update
    }
  }

  private setupMessageHandling(context: vscode.ExtensionContext) {
    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        switch (message.command) {
          case "openLogFile":
            if (message.path) {
              const document = await vscode.workspace.openTextDocument(
                vscode.Uri.file(message.path)
              );
              const editor = await vscode.window.showTextDocument(document);

              // If line number is provided, move to that line
              if (typeof message.line === "number") {
                const line = message.line - 1; // Convert to 0-based
                const range = document.lineAt(line).range;
                editor.selection = new vscode.Selection(
                  range.start,
                  range.start
                );
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
              }
            }
            break;
          case "filterLogs":
            if (
              typeof message.level === "string" ||
              typeof message.logger === "string" ||
              typeof message.search === "string"
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
                search:
                  typeof message.search === "string"
                    ? message.search
                    : this.filters.search,
              };
              await this.applyFiltersAsync();
            }
            break;
          case "clearFilters":
            this.filters = { level: "", logger: "", search: "" };
            await this.applyFiltersAsync();
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

  private async applyFiltersAsync(isProgressiveUpdate: boolean = false) {
    if (!isProgressiveUpdate) {
      // Only show filtering progress for user-initiated filters
      const startTime = Date.now();
      let filteredLogs: LogEntry[] = [];

      // Process logs in chunks to avoid blocking the UI
      for (let i = 0; i < this.allLogs.length; i += this.CHUNK_SIZE) {
        const chunk = this.allLogs.slice(i, i + this.CHUNK_SIZE);
        const filteredChunk = chunk.filter((log) => {
          const levelMatch =
            !this.filters.level ||
            log.level.toLowerCase() === this.filters.level.toLowerCase();
          const loggerMatch =
            !this.filters.logger || log.logger === this.filters.logger;
          const searchMatch =
            !this.filters.search ||
            log.level
              .toLowerCase()
              .includes(this.filters.search.toLowerCase()) ||
            log.logger
              .toLowerCase()
              .includes(this.filters.search.toLowerCase()) ||
            log.message
              .toLowerCase()
              .includes(this.filters.search.toLowerCase());
          return levelMatch && loggerMatch && searchMatch;
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
    } else {
      // For progressive updates, apply filters immediately
      this.currentLogs = this.allLogs.filter((log) => {
        const levelMatch =
          !this.filters.level ||
          log.level.toLowerCase() === this.filters.level.toLowerCase();
        const loggerMatch =
          !this.filters.logger || log.logger === this.filters.logger;
        const searchMatch =
          !this.filters.search ||
          log.level.toLowerCase().includes(this.filters.search.toLowerCase()) ||
          log.logger
            .toLowerCase()
            .includes(this.filters.search.toLowerCase()) ||
          log.message.toLowerCase().includes(this.filters.search.toLowerCase());
        return levelMatch && loggerMatch && searchMatch;
      });
    }

    this.isLoading = false;
    const stats = this.calculateStats();
    this.panel.webview.postMessage({
      command: "updateLogs",
      logs: this.currentLogs,
      stats,
      filters: this.filters,
      isLoading: this.isLoading,
    });
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
      isLoading: this.isLoading,
      progress,
    });
  }

  private calculateStats(): LogStats {
    const stats: LogStats = {
      totalEntries: this.isLoading
        ? "Loading..."
        : `${this.currentLogs.length}`,
      byLevel: {} as Record<string, number>,
      byLogger: {} as Record<string, number>,
      totalByLevel: {} as Record<string, number>,
      allLevels: [
        ...new Set([
          ...this.allLogs.map((log) => log.level),
          ...this.currentLogs.map((log) => log.level),
        ]),
      ],
      allLoggers: [
        ...new Set([
          ...this.allLogs.map((log) => log.logger),
          ...this.currentLogs.map((log) => log.logger),
        ]),
      ],
    };

    if (!this.isLoading) {
      // Calculate total counts from all logs first
      for (let i = 0; i < this.allLogs.length; i += this.CHUNK_SIZE) {
        const chunk = this.allLogs.slice(i, i + this.CHUNK_SIZE);
        chunk.forEach((log) => {
          stats.totalByLevel[log.level] =
            (stats.totalByLevel[log.level] || 0) + 1;
        });
      }

      // Then calculate filtered counts
      for (let i = 0; i < this.currentLogs.length; i += this.CHUNK_SIZE) {
        const chunk = this.currentLogs.slice(i, i + this.CHUNK_SIZE);
        chunk.forEach((log) => {
          stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
          stats.byLogger[log.logger] = (stats.byLogger[log.logger] || 0) + 1;
        });
      }
    }

    return stats;
  }

  private updateWebview() {
    // If we're loading and have no logs yet, show default filter options
    const stats = this.calculateStats();
    if (this.isLoading && this.allLogs.length === 0) {
      stats.allLevels = ["ERROR", "WARNING", "INFO", "DEBUG"]; // Default options
      stats.allLoggers = ["Application"]; // Default option
    }

    this.panel.webview.html = getWebviewContent(
      this.currentLogs,
      stats,
      this.filters
    );
  }
}
