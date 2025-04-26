import * as vscode from 'vscode';
import { parseLogFile } from './utils/parser';
import { LogViewerPanel } from './webview/panel';

export function activate(context: vscode.ExtensionContext) {
    const registerCommand = (commandId: string) => {
        return vscode.commands.registerCommand(commandId, async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: {
                    'Log Files': ['log']
                }
            });

            if (fileUri && fileUri[0]) {
                const document = await vscode.workspace.openTextDocument(fileUri[0]);
                const logs = parseLogFile(document.getText());

                if (!logs.length) {
                    vscode.window.showInformationMessage('No valid log entries found in the file.');
                    return;
                }

                new LogViewerPanel(context, logs, fileUri[0].fsPath);
            }
        });
    };

    // Register both commands with the same handler
    context.subscriptions.push(
        registerCommand('log-whisperer.viewLog'),
        registerCommand('log-whisperer.parseLog')
    );
}

export function deactivate() {}
