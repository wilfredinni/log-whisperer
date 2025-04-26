import * as vscode from "vscode";
import { parseLogFileStream } from "./utils/parser";
import { LogViewerPanel } from "./webview/panel";
import { LogExplorerViewProvider } from "./webview/sidebarProvider";

export function activate(context: vscode.ExtensionContext) {
  const logExplorerProvider = new LogExplorerViewProvider(context.extensionUri);

  const sidebarView = vscode.window.registerWebviewViewProvider(
    "logWhispererView",
    logExplorerProvider
  );

  const handleLogFile = async (fileUri: vscode.Uri) => {
    // Create panel immediately to show loading state
    const panel = new LogViewerPanel(context, [], fileUri.fsPath);

    // Show progress indicator
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Loading log file",
        cancellable: false,
      },
      async (progress) => {
        try {
          let lastProgress = 0;
          for await (const result of parseLogFileStream(fileUri)) {
            const increment = result.progress - lastProgress;
            progress.report({
              increment,
              message: `Parsed ${result.entries.length} entries...`,
            });
            lastProgress = result.progress;

            // Update panel with current entries
            panel.updateEntries(result.entries, !result.isDone);
          }
        } catch (err) {
          const error = err as Error;
          vscode.window.showErrorMessage(
            `Error parsing log file: ${error?.message || "Unknown error"}`
          );
        }
      }
    );
  };

  // Register commands
  context.subscriptions.push(
    sidebarView,
    vscode.commands.registerCommand("log-whisperer.viewLog", handleLogFile)
  );
}

export function deactivate() {}
