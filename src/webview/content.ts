import { LogEntry, LogStats, LogFilters } from '../models/types';
import { getLogLevelColor } from '../utils/parser';

export function getWebviewContent(logs: LogEntry[], stats: LogStats, filters: LogFilters): string {
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