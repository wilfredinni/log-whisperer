import * as vscode from "vscode";
import * as path from "path";
import { LogEntry, LogExplorerState } from "../models/types";
import { parseLogFileStream } from "../utils/parser";
import { SIDEBAR_STYLES } from "./styles/sidebarStyles";
import {
  LogSummary,
  calculateLogSummary,
  getLogLevelColor,
  formatNumber,
} from "./helpers/sidebarHelpers";

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

  private _updateWebview() {
    if (!this._view) {
      return;
    }

    this._view.webview.html = this._getHtmlForWebview(this._view.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                ${SIDEBAR_STYLES}
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
                        const summary = calculateLogSummary(file.entries);
                        return `
                            <div class="log-file" data-path="${file.path}">
                                <div class="file-header">
                                    <div class="file-name-row">
                                        <span class="file-name">${
                                          file.name
                                        }</span>
                                        <span class="total-count">${formatNumber(
                                          summary.total
                                        )} logs</span>
                                    </div>
                                    <div class="log-badges">
                                        <span class="log-badge fatal" data-has-logs="${
                                          summary.fatal > 0
                                        }" title="FATAL">${formatNumber(
                          summary.fatal
                        )}</span>
                                        <span class="log-badge error" data-has-logs="${
                                          summary.errors > 0
                                        }" title="ERROR">${formatNumber(
                          summary.errors
                        )}</span>
                                        <span class="log-badge warning" data-has-logs="${
                                          summary.warnings > 0
                                        }" title="WARNING">${formatNumber(
                          summary.warnings
                        )}</span>
                                        <span class="log-badge info" data-has-logs="${
                                          summary.info > 0
                                        }" title="INFO">${formatNumber(
                          summary.info
                        )}</span>
                                        <span class="log-badge debug" data-has-logs="${
                                          summary.debug > 0
                                        }" title="DEBUG">${formatNumber(
                          summary.debug
                        )}</span>
                                        <span class="log-badge trace" data-has-logs="${
                                          summary.trace > 0
                                        }" title="TRACE">${formatNumber(
                          summary.trace
                        )}</span>
                                        <span class="log-badge other" data-has-logs="${
                                          summary.other > 0
                                        }" title="OTHER">${formatNumber(
                          summary.other
                        )}</span>
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
