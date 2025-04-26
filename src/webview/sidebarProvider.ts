import * as vscode from 'vscode';
import * as path from 'path';

export class LogExplorerViewProvider implements vscode.WebviewViewProvider {
    constructor(
        private readonly extensionUri: vscode.Uri,
    ) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'selectFolder':
                        const folderUri = await vscode.window.showOpenDialog({
                            canSelectFiles: false,
                            canSelectFolders: true,
                            canSelectMany: false,
                            title: 'Select Log Folder'
                        });
                        
                        if (folderUri && folderUri[0]) {
                            const logFiles = await vscode.workspace.findFiles(
                                new vscode.RelativePattern(folderUri[0], '**/*.log')
                            );
                            
                            webviewView.webview.postMessage({
                                type: 'folderSelected',
                                folder: folderUri[0].fsPath,
                                logFiles: logFiles.map(file => ({
                                    path: file.fsPath,
                                    name: path.basename(file.fsPath)
                                }))
                            });
                        }
                        break;
                    case 'openLog':
                        if (message.path) {
                            const uri = vscode.Uri.file(message.path);
                            const document = await vscode.workspace.openTextDocument(uri);
                            const logs = await vscode.commands.executeCommand('log-whisperer.parseLog', uri);
                        }
                        break;
                }
            }
        );
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 15px;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                button {
                    width: 100%;
                    padding: 8px;
                    margin: 5px 0;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .log-list {
                    margin-top: 10px;
                }
                .log-item {
                    padding: 5px;
                    margin: 2px 0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .log-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
            </style>
        </head>
        <body>
            <button id="selectFolder">
                <span class="codicon codicon-folder"></span>
                Select Log Folder
            </button>
            <div id="logList" class="log-list"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('selectFolder').addEventListener('click', () => {
                    vscode.postMessage({ type: 'selectFolder' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'folderSelected':
                            const logList = document.getElementById('logList');
                            logList.innerHTML = message.logFiles.map(file => \`
                                <div class="log-item" data-path="\${file.path}">
                                    <span class="codicon codicon-file"></span>
                                    \${file.name}
                                </div>
                            \`).join('');
                            
                            document.querySelectorAll('.log-item').forEach(item => {
                                item.addEventListener('click', () => {
                                    vscode.postMessage({
                                        type: 'openLog',
                                        path: item.dataset.path
                                    });
                                });
                            });
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}