import { LogEntry, LogStats, LogFilters } from "../models/types";

export function getWebviewContent(
  logs: LogEntry[],
  stats: LogStats,
  filters: LogFilters
): string {
  return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: var(--vscode-editor-font-family);
                padding: 10px;
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
            }
            .stats {
                position: sticky;
                top: 0;
                z-index: 100;
                margin-bottom: 20px;
                padding: 10px;
                background: var(--vscode-editor-background);
                border-bottom: 1px solid var(--vscode-widget-border);
            }
            .filters {
                position: sticky;
                top: 100px;
                z-index: 100;
                margin-bottom: 20px;
                padding: 10px;
                background: var(--vscode-editor-background);
                border-bottom: 1px solid var(--vscode-widget-border);
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .virtual-scroll-container {
                height: calc(100vh - 200px);
                overflow-y: auto;
            }
            .log-entries {
                position: relative;
            }
            .log-entry {
                position: absolute;
                left: 0;
                right: 0;
                height: 40px;
                padding: 8px;
                box-sizing: border-box;
                background: var(--vscode-editor-background);
                border-left: 3px solid transparent;
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: var(--vscode-editor-font-family);
            }
            .timestamp {
                color: var(--vscode-textPreformat-foreground);
                white-space: nowrap;
            }
            .logger {
                color: var(--vscode-textLink-foreground);
                white-space: nowrap;
            }
            .level {
                white-space: nowrap;
            }
            .message {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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
        </style>
    </head>
    <body>
        <div class="stats">
            <h3>Log Statistics</h3>
            <p>Showing ${stats.totalEntries} entries</p>
            <div style="display: flex; gap: 20px;">
                ${Object.entries(stats.byLevel)
                  .map(([level, count]) => `<div>${level}: ${count}</div>`)
                  .join("")}
            </div>
        </div>

        <div class="filters">
            <div class="filter-group">
                <label>Level:</label>
                <select id="levelFilter">
                    <option value="">All</option>
                    ${stats.allLevels
                      .map(
                        (level: string) =>
                          `<option value="${level}" ${
                            filters.level === level ? "selected" : ""
                          }>${level}</option>`
                      )
                      .join("")}
                </select>
            </div>
            <div class="filter-group">
                <label>Logger:</label>
                <select id="loggerFilter">
                    <option value="">All</option>
                    ${stats.allLoggers
                      .map(
                        (logger: string) =>
                          `<option value="${logger}" ${
                            filters.logger === logger ? "selected" : ""
                          }>${logger}</option>`
                      )
                      .join("")}
                </select>
            </div>
            <button id="clearFilters">Clear Filters</button>
        </div>

        <div class="virtual-scroll-container" id="virtualScroller">
            <div class="log-entries" id="logEntries"></div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const ROW_HEIGHT = 40;
            const BUFFER_SIZE = 50;
            let logs = ${JSON.stringify(logs)};

            const virtualScroller = document.getElementById('virtualScroller');
            const logEntriesContainer = document.getElementById('logEntries');

            function renderVisibleLogs() {
                const scrollTop = virtualScroller.scrollTop;
                const containerHeight = virtualScroller.clientHeight;

                const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
                const endIndex = Math.min(logs.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_SIZE);

                logEntriesContainer.style.height = \`\${logs.length * ROW_HEIGHT}px\`;

                const fragment = document.createDocumentFragment();
                for (let i = startIndex; i < endIndex; i++) {
                    const log = logs[i];
                    const div = document.createElement('div');
                    div.className = 'log-entry';
                    div.style.top = \`\${i * ROW_HEIGHT}px\`;
                    div.style.borderLeftColor = getLogLevelColor(log.level);

                    const timestamp = document.createElement('span');
                    timestamp.className = 'timestamp';
                    timestamp.textContent = \`[\${log.timestamp}]\`;

                    const logger = document.createElement('span');
                    logger.className = 'logger';
                    logger.textContent = log.logger;

                    const level = document.createElement('span');
                    level.className = 'level';
                    level.style.color = getLogLevelColor(log.level);
                    level.textContent = log.level;

                    const message = document.createElement('span');
                    message.className = 'message';
                    message.textContent = log.message;

                    div.appendChild(timestamp);
                    div.appendChild(logger);
                    div.appendChild(level);
                    div.appendChild(message);
                    fragment.appendChild(div);
                }

                logEntriesContainer.innerHTML = '';
                logEntriesContainer.appendChild(fragment);
            }

            function getLogLevelColor(level) {
                switch (level.toLowerCase()) {
                    case 'error': return '#ff0000';
                    case 'warning': return '#ffa500';
                    case 'info': return '#00ff00';
                    default: return '#ffffff';
                }
            }

            let scrollTimeout;
            virtualScroller.addEventListener('scroll', () => {
                if (scrollTimeout) {
                    cancelAnimationFrame(scrollTimeout);
                }
                scrollTimeout = requestAnimationFrame(renderVisibleLogs);
            });

            // Initial render
            renderVisibleLogs();

            // Handle filtering
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

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateLogs':
                        logs = message.logs;
                        renderVisibleLogs();
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}
