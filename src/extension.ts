import * as vscode from 'vscode';
import { parseLogFile } from './utils/parser';
import { LogViewerPanel } from './webview/panel';
import { LogExplorerViewProvider } from './webview/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const logExplorerProvider = new LogExplorerViewProvider(context.extensionUri);
    
    const sidebarView = vscode.window.registerWebviewViewProvider(
        'logWhispererView',
        logExplorerProvider
    );

    const handleLogFile = async (filePath: string) => {
        const document = await vscode.workspace.openTextDocument(filePath);
        const logs = parseLogFile(document.getText());
        
        if (!logs.length) {
            vscode.window.showInformationMessage('No valid log entries found in the file.');
            return;
        }

        new LogViewerPanel(context, logs, filePath);
    };

    const registerCommand = (commandId: string) => {
        return vscode.commands.registerCommand(commandId, async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: false,
                filters: {
                    'Log Files': ['log']
                }
            });

            if (fileUri && fileUri[0]) {
                await handleLogFile(fileUri[0].fsPath);
            }
        });
    };

    // Register commands
    context.subscriptions.push(
        sidebarView,
        registerCommand('log-whisperer.viewLog'),
        registerCommand('log-whisperer.parseLog')
    );
}

export function deactivate() {}
