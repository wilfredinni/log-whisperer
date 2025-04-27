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
          return "var(--vscode-problemsWarningIcon-foreground)";
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
                    padding: 0;
                    margin: 0;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background: var(--vscode-sideBar-background);
                }
                .container {
                    padding: 0 12px;
                }
                .toolbar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    padding: 8px 12px;
                    margin: 0 -12px 12px;
                    background: var(--vscode-sideBar-background);
                    border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .toolbar h3 {
                    margin: 0;
                    font-size: var(--vscode-font-size);
                    font-weight: 600;
                    color: var(--vscode-sideBarTitle-foreground);
                    opacity: 0.9;
                }
                .refresh-button {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 11px;
                    height: 24px;
                }
                .refresh-button:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .log-files {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .log-file {
                    background: var(--vscode-list-inactiveSelectionBackground);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-widget-border);
                    transition: all 0.1s ease;
                }
                .log-file:hover {
                    background: var(--vscode-list-hoverBackground);
                    border-color: var(--vscode-focusBorder);
                }
                .file-header {
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    user-select: none;
                }
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .file-icon {
                    opacity: 0.8;
                    color: var(--vscode-icon-foreground);
                }
                .file-name {
                    font-weight: 500;
                    color: var(--vscode-editor-foreground);
                }
                .log-badges {
                    display: flex;
                    gap: 4px;
                    margin-left: auto;
                }
                .log-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    min-width: 30px;
                    height: 14px;
                    justify-content: center;
                    opacity: 0.4;
                    transition: opacity 0.2s ease;
                }
                .log-badge[data-has-logs="true"] {
                    opacity: 1;
                }
                .log-badge.error {
                    background-color: var(--vscode-errorForeground);
                    color: var(--vscode-editor-background);
                }
                .log-badge.warning {
                    background-color: var(--vscode-problemsWarningIcon-foreground);
                    color: var(--vscode-editor-background);
                }
                .log-badge.info {
                    background-color: var(--vscode-notificationsInfoIcon-foreground);
                    color: var(--vscode-editor-background);
                }
                .log-badge.other {
                    background-color: var(--vscode-descriptionForeground);
                    color: var(--vscode-editor-background);
                }
                .empty-state {
                    padding: 24px 16px;
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <h3>Log Files</h3>
                <button class="refresh-button" id="refreshButton">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M13.666 3.667l-1.334-1.334v2H10.25l-.583.583C8.75 4.083 7.583 3.667 6.333 3.667c-2.917 0-5.25 2.333-5.25 5.25s2.333 5.25 5.25 5.25 5.25-2.333 5.25-5.25h-1.75c0 1.917-1.583 3.5-3.5 3.5s-3.5-1.583-3.5-3.5 1.583-3.5 3.5-3.5c.917 0 1.75.333 2.333.917l-1.75 1.75h4.084v-4.084z" fill="currentColor"/>
                    </svg>
                    Refresh
                </button>
            </div>
            <div class="container">
                <div class="log-files">
                    ${
                      this._state.logFiles.length === 0
                        ? `
                        <div class="empty-state">
                            No log files found in the workspace.<br>
                            Add .log files and click refresh to scan.
                        </div>
                    `
                        : ""
                    }
                    ${this._state.logFiles
                      .map((file) => {
                        const summary = this.calculateLogSummary(file.entries);
                        return `
                            <div class="log-file" data-path="${file.path}">
                                <div class="file-header">
                                    <div class="file-info">
                                        <span class="file-icon">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M13.85 4.44l-3.28-3.3-.35-.14H2.5l-.5.5v13l.5.5h11l.5-.5V4.8l-.15-.36zM13 13.5H3v-12h6.5l3.5 3.5v8.5z" fill="currentColor"/>
                                            </svg>
                                        </span>
                                        <span class="file-name">${
                                          file.name
                                        }</span>
                                    </div>
                                    <div class="log-badges">
                                        <span class="log-badge error" data-has-logs="${
                                          summary.errors > 0
                                        }">${summary.errors}</span>
                                        <span class="log-badge warning" data-has-logs="${
                                          summary.warnings > 0
                                        }">${summary.warnings}</span>
                                        <span class="log-badge info" data-has-logs="${
                                          summary.info > 0
                                        }">${summary.info}</span>
                                        <span class="log-badge other" data-has-logs="${
                                          summary.other > 0
                                        }">${summary.other}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
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
