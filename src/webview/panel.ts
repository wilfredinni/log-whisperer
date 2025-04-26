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
      (message: WebviewMessage) => {
        switch (message.command) {
          case "filterLogs":
            if ("level" in message) {
              this.filters.level = message.level || "";
            }
            if ("logger" in message) {
              this.filters.logger = message.logger || "";
            }
            this.updateWebview();
            break;
          case "clearFilters":
            this.filters = { level: "", logger: "" };
            this.updateWebview();
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  }

  private updateWebview() {
    // Apply filters
    this.currentLogs = this.allLogs.filter((log) => {
      const levelMatch =
        !this.filters.level || log.level === this.filters.level;
      const loggerMatch =
        !this.filters.logger || log.logger === this.filters.logger;
      return levelMatch && loggerMatch;
    });

    // Update stats
    const stats: LogStats = {
      totalEntries: this.currentLogs.length,
      byLevel: {} as Record<string, number>,
      byLogger: {} as Record<string, number>,
      allLevels: [...new Set(this.allLogs.map((log) => log.level))],
      allLoggers: [...new Set(this.allLogs.map((log) => log.logger))],
    };

    this.currentLogs.forEach((log) => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byLogger[log.logger] = (stats.byLogger[log.logger] || 0) + 1;
    });

    this.panel.webview.html = getWebviewContent(
      this.currentLogs,
      stats,
      this.filters
    );
  }
}
