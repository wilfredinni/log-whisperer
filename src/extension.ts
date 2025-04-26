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

    const handleLogFile = async (fileUri: vscode.Uri) => {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const logs = parseLogFile(document.getText());
        
        if (!logs.length) {
            vscode.window.showInformationMessage('No valid log entries found in the file.');
            return;
        }

        new LogViewerPanel(context, logs, fileUri.fsPath);
    };

    // Register commands
    context.subscriptions.push(
        sidebarView,
        vscode.commands.registerCommand('log-whisperer.viewLog', handleLogFile)
    );
}

export function deactivate() {}
