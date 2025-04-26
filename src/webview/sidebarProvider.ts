import * as vscode from "vscode";
import * as path from "path";
import { LogEntry, LogExplorerState } from "../models/types";
import { parseLogFileStream } from "../utils/parser";

interface LogSummary {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  other: number;
}

export class LogExplorerViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _state: LogExplorerState = { logFiles: [] };

  constructor(private readonly extensionUri: vscode.Uri) {
    this.scanWorkspace();
  }

  private async scanWorkspace() {
    // Find all log files in the workspace
    const logFiles = await vscode.workspace.findFiles("**/*.log");

    this._state.logFiles = [];

    for (const file of logFiles) {
      try {
        const entries: LogEntry[] = [];
        for await (const result of parseLogFileStream(file)) {
          if (result.isDone) {
            this._state.logFiles.push({
              path: file.fsPath,
              name: path.basename(file.fsPath),
              entries: result.entries,
              isExpanded: false,
            });
          }
        }
      } catch (err) {
        console.error(`Error parsing log file ${file.fsPath}:`, err);
      }
    }

    this._updateWebview();
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    this._updateWebview();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "openLogFile":
          if (message.path) {
            const file = this._state.logFiles.find(
              (f) => f.path === message.path
            );
            if (file) {
              // Use the existing LogViewerPanel to show the log file
              const document = await vscode.workspace.openTextDocument(
                vscode.Uri.file(file.path)
              );
              vscode.commands.executeCommand(
                "log-whisperer.viewLog",
                document.uri
              );
            }
          }
          break;
        case "refresh":
          await this.scanWorkspace();
          break;
      }
    });
  }

  private calculateLogSummary(entries: LogEntry[]): LogSummary {
    const summary: LogSummary = {
      total: entries.length,
      errors: 0,
      warnings: 0,
      info: 0,
      other: 0,
    };

    entries.forEach((entry) => {
      const level = entry.level.toLowerCase();
      if (level.includes("error")) {
        summary.errors++;
      } else if (level.includes("warn")) {
        summary.warnings++;
      } else if (level.includes("info")) {
        summary.info++;
      } else {
        summary.other++;
      }
    });

    return summary;
  }

  private _updateWebview() {
    if (!this._view) {
      return;
    }

    this._view.webview.html = this._getHtmlForWebview(this._view.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const getLogLevelColor = (level: string): string => {
      switch (level.toLowerCase()) {
        case "error":
          return "var(--vscode-errorForeground)";
        case "warning":
          return "var(--vscode-warningForeground)";
        case "info":
          return "var(--vscode-notificationsInfoIcon-foreground)";
        default:
          return "var(--vscode-foreground)";
      }
    };

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 10px;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
                .log-file {
                    margin: 10px 0;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-widget-border);
                    cursor: pointer;
                }
                .log-file:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .file-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                .file-name {
                    font-weight: bold;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 4px;
                    font-size: 12px;
                }
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .stat-count {
                    font-weight: bold;
                }
                .toolbar {
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: flex-end;
                }
                .refresh-button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                }
                .refresh-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="refresh-button" id="refreshButton">
                    <span class="codicon codicon-refresh"></span>
                    Refresh
                </button>
            </div>
            <div id="logFiles">
                ${this._state.logFiles
                  .map((file) => {
                    const summary = this.calculateLogSummary(file.entries);
                    return `
                        <div class="log-file" data-path="${file.path}">
                            <div class="file-header">
                                <span class="file-name">${file.name}</span>
                                <span class="total-count">${
                                  summary.total
                                } entries</span>
                            </div>
                            <div class="stats">
                                <div class="stat-item">
                                    <span style="color: ${getLogLevelColor(
                                      "error"
                                    )}">⬤</span>
                                    <span class="stat-count">${
                                      summary.errors
                                    }</span>
                                    <span>Errors</span>
                                </div>
                                <div class="stat-item">
                                    <span style="color: ${getLogLevelColor(
                                      "warning"
                                    )}">⬤</span>
                                    <span class="stat-count">${
                                      summary.warnings
                                    }</span>
                                    <span>Warnings</span>
                                </div>
                                <div class="stat-item">
                                    <span style="color: ${getLogLevelColor(
                                      "info"
                                    )}">⬤</span>
                                    <span class="stat-count">${
                                      summary.info
                                    }</span>
                                    <span>Info</span>
                                </div>
                                <div class="stat-item">
                                    <span>⬤</span>
                                    <span class="stat-count">${
                                      summary.other
                                    }</span>
                                    <span>Other</span>
                                </div>
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('refreshButton').addEventListener('click', () => {
                    vscode.postMessage({ command: 'refresh' });
                });

                document.querySelectorAll('.log-file').forEach(file => {
                    file.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'openLogFile',
                            path: file.dataset.path
                        });
                    });
                });
            </script>
        </body>
        </html>`;
  }
}
