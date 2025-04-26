import * as vscode from 'vscode';
import * as path from 'path';

interface LogEntry {
    timestamp: string;
    level: string;
    logger: string;
    message: string;
    raw: string;
}

interface LogStats {
    totalEntries: number;
    byLevel: Record<string, number>;
    byLogger: Record<string, number>;
    allLevels: string[];
    allLoggers: string[];
}

export function activate(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    // Register both commands
    let viewLogDisposable = vscode.commands.registerCommand('log-whisperer.viewLog', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                'Log Files': ['log']
            }
        });

        if (fileUri && fileUri[0]) {
            const document = await vscode.workspace.openTextDocument(fileUri[0]);
            const logs = parseLogFile(document.getText());
            showLogViewer(context, logs, fileUri[0].fsPath);
        }
    });

    let parseLogDisposable = vscode.commands.registerCommand('log-whisperer.parseLog', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                'Log Files': ['log']
            }
        });

        if (fileUri && fileUri[0]) {
            const document = await vscode.workspace.openTextDocument(fileUri[0]);
            const logs = parseLogFile(document.getText());
            showLogViewer(context, logs, fileUri[0].fsPath);
        }
    });

    context.subscriptions.push(viewLogDisposable, parseLogDisposable);
}

function parseLogFile(content: string): LogEntry[] {
    const lines = content.split('\n');
    const logs: LogEntry[] = [];

    for (const line of lines) {
        if (!line.trim()) {
            continue;
        }

        // Match Django log format: TIMESTAMP LOGGER LEVEL MESSAGE
        const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},\d{3})\s+([\w.]+)\s+(\w+)\s+(.+)$/);
        if (match) {
            const [, timestamp, logger, level, message] = match;
            logs.push({
                timestamp,
                logger,
                level,
                message,
                raw: line
            });
        }
    }

    return logs;
}

function showLogViewer(context: vscode.ExtensionContext, logs: LogEntry[], fileName: string) {
    if (!logs.length) {
        vscode.window.showInformationMessage('No valid log entries found in the file.');
        return;
    }

    const panel = vscode.window.createWebviewPanel(
        'logWhisperer',
        `Log Viewer - ${path.basename(fileName)}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const allLogs = [...logs]; // Keep a copy of all logs for filtering
    let currentLogs = allLogs;
    let currentFilters = {
        level: '',
        logger: ''
    };

    const updateWebview = () => {
        // Apply filters
        currentLogs = allLogs.filter(log => {
            const levelMatch = !currentFilters.level || log.level === currentFilters.level;
            const loggerMatch = !currentFilters.logger || log.logger === currentFilters.logger;
            return levelMatch && loggerMatch;
        });

        // Update stats based on filtered logs
        const stats: LogStats = {
            totalEntries: currentLogs.length,
            byLevel: {} as Record<string, number>,
            byLogger: {} as Record<string, number>,
            // Keep track of all available options even when filtered
            allLevels: [...new Set(allLogs.map(log => log.level))],
            allLoggers: [...new Set(allLogs.map(log => log.logger))]
        };

        currentLogs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byLogger[log.logger] = (stats.byLogger[log.logger] || 0) + 1;
        });

        panel.webview.html = getWebviewContent(currentLogs, stats, currentFilters);
    };

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'filterLogs':
                    if ('level' in message) {
                        currentFilters.level = message.level;
                    }
                    if ('logger' in message) {
                        currentFilters.logger = message.logger;
                    }
                    updateWebview();
                    break;
                case 'clearFilters':
                    currentFilters = { level: '', logger: '' };
                    updateWebview();
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    updateWebview();
}

function getWebviewContent(logs: LogEntry[], stats: LogStats, filters: { level: string, logger: string }): string {
    const getLogLevelColor = (level: string): string => {
        switch (level.toUpperCase()) {
            case 'ERROR': return '#ff0000';
            case 'WARNING': return '#ffa500';
            case 'INFO': return '#00ff00';
            default: return '#ffffff';
        }
    };

    return `<!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: var(--vscode-editor-font-family); 
                padding: 10px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
            }
            .stats { 
                margin-bottom: 20px;
                padding: 10px;
                background: var(--vscode-editor-lineHighlightBackground);
                border-radius: 4px;
            }
            .log-entry { 
                margin: 5px 0; 
                padding: 8px;
                border-radius: 3px;
                background: var(--vscode-editor-lineHighlightBackground);
                font-family: var(--vscode-editor-font-family);
            }
            .timestamp { 
                color: var(--vscode-textPreformat-foreground);
                margin-right: 8px;
            }
            .logger { 
                color: var(--vscode-textLink-foreground);
                margin-right: 8px;
            }
            .filters { 
                margin-bottom: 20px;
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .filter-group {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            select {
                background: var(--vscode-dropdown-background);
                color: var(--vscode-dropdown-foreground);
                border: 1px solid var(--vscode-dropdown-border);
                padding: 4px;
                border-radius: 2px;
            }
            button {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 4px 8px;
                border-radius: 2px;
                cursor: pointer;
            }
            button:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .message {
                margin-top: 4px;
                word-break: break-word;
            }
        </style>
    </head>
    <body>
        <div class="stats">
            <h3>Log Statistics</h3>
            <p>Showing ${stats.totalEntries} entries</p>
            <h4>Distribution by Level:</h4>
            ${Object.entries(stats.byLevel).map(([level, count]) => 
                `<div>${level}: ${count}</div>`
            ).join('')}
        </div>

        <div class="filters">
            <div class="filter-group">
                <label>Level:</label>
                <select id="levelFilter">
                    <option value="">All</option>
                    ${stats.allLevels.map((level: string) => 
                        `<option value="${level}" ${filters.level === level ? 'selected' : ''}>${level}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>Logger:</label>
                <select id="loggerFilter">
                    <option value="">All</option>
                    ${stats.allLoggers.map((logger: string) => 
                        `<option value="${logger}" ${filters.logger === logger ? 'selected' : ''}>${logger}</option>`
                    ).join('')}
                </select>
            </div>
            <button id="clearFilters">Clear Filters</button>
        </div>

        <div id="logEntries">
            ${logs.map(log => `
                <div class="log-entry" style="border-left: 3px solid ${getLogLevelColor(log.level)}">
                    <span class="timestamp">[${log.timestamp}]</span>
                    <span class="logger">${log.logger}</span>
                    <span class="level" style="color: ${getLogLevelColor(log.level)}">${log.level}</span>
                    <div class="message">${log.message}</div>
                </div>
            `).join('')}
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('levelFilter').addEventListener('change', (e) => {
                vscode.postMessage({
                    command: 'filterLogs',
                    level: e.target.value
                });
            });

            document.getElementById('loggerFilter').addEventListener('change', (e) => {
                vscode.postMessage({
                    command: 'filterLogs',
                    logger: e.target.value
                });
            });

            document.getElementById('clearFilters').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearFilters'
                });
            });
        </script>
    </body>
    </html>`;
}

export function deactivate() {}
