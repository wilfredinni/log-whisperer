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
                min-height: 40px;
                padding: 8px;
                box-sizing: border-box;
                background: var(--vscode-editor-background);
                border-left: 3px solid transparent;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-family: var(--vscode-editor-font-family);
                cursor: pointer;
            }
            .log-entry:hover {
                background: var(--vscode-list-hoverBackground);
            }
            .log-entry.expanded .message {
                white-space: pre-wrap;
            }
            .timestamp {
                color: var(--vscode-textPreformat-foreground);
                white-space: nowrap;
                cursor: pointer;
            }
            .timestamp:hover {
                text-decoration: underline;
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
            .message.has-multiline::after {
                content: '⌄';
                margin-left: 4px;
                color: var(--vscode-textLink-foreground);
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
            .goto-file {
                opacity: 0.6;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
            }
            .goto-file:hover {
                opacity: 1;
                background: var(--vscode-button-hoverBackground);
            }
            .goto-file[data-disabled] {
                opacity: 0.3;
                cursor: not-allowed;
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
            // Track expanded entries and their heights
            const expandedEntries = new Map();

            const virtualScroller = document.getElementById('virtualScroller');
            const logEntriesContainer = document.getElementById('logEntries');

            function getEntryTop(index) {
                // Calculate position taking into account expanded entries before this one
                let top = index * ROW_HEIGHT;

                for (const [expandedIdx, height] of expandedEntries.entries()) {
                    if (expandedIdx < index) {
                        top += (height - ROW_HEIGHT);
                    }
                }
                return top;
            }

            function renderVisibleLogs() {
                // Calculate the full height considering expanded entries
                let totalHeight = logs.length * ROW_HEIGHT;
                for (const [_, height] of expandedEntries.entries()) {
                    totalHeight += (height - ROW_HEIGHT);
                }
                logEntriesContainer.style.height = \`\${totalHeight}px\`;

                // Determine visible range based on scroll position
                const scrollTop = virtualScroller.scrollTop;
                const containerHeight = virtualScroller.clientHeight;

                // Find the visible range, taking expanded entries into account
                let startIdx = 0;
                let currentHeight = 0;

                // Find approximate start index based on scroll position
                for (let i = 0; i < logs.length; i++) {
                    const entryHeight = expandedEntries.has(i) ? expandedEntries.get(i) : ROW_HEIGHT;
                    if (currentHeight + entryHeight > scrollTop - ROW_HEIGHT * BUFFER_SIZE) {
                        startIdx = i;
                        break;
                    }
                    currentHeight += entryHeight;
                }

                // Find end index (adding buffer)
                let endIdx = startIdx;
                let visibleHeight = 0;
                while (endIdx < logs.length && visibleHeight < containerHeight + ROW_HEIGHT * BUFFER_SIZE * 2) {
                    const entryHeight = expandedEntries.has(endIdx) ? expandedEntries.get(endIdx) : ROW_HEIGHT;
                    visibleHeight += entryHeight;
                    endIdx++;
                }

                const fragment = document.createDocumentFragment();
                for (let i = startIdx; i < endIdx; i++) {
                    const log = logs[i];
                    const div = document.createElement('div');
                    div.className = 'log-entry';

                    // Position based on expanded entries
                    const top = getEntryTop(i);
                    div.style.top = \`\${top}px\`;

                    // Set height if expanded
                    if (expandedEntries.has(i)) {
                        div.classList.add('expanded');
                        div.style.height = \`\${expandedEntries.get(i)}px\`;
                    }

                    div.style.borderLeftColor = getLogLevelColor(log.level);
                    div.dataset.index = i;

                    const timestamp = document.createElement('span');
                    timestamp.className = 'timestamp';
                    timestamp.textContent = \`[\${log.timestamp}]\`;
                    timestamp.title = 'Click to open file at this log line';

                    const logger = document.createElement('span');
                    logger.className = 'logger';
                    logger.textContent = log.logger;

                    const level = document.createElement('span');
                    level.className = 'level';
                    level.style.color = getLogLevelColor(log.level);
                    level.textContent = log.level;

                    const message = document.createElement('span');
                    message.className = 'message';
                    if (log.raw && log.raw !== log.message) {
                        message.classList.add('has-multiline');
                    }

                    // Show full content if expanded
                    if (expandedEntries.has(i)) {
                        message.textContent = log.raw;
                    } else {
                        message.textContent = log.message;
                    }

                    const gotoFile = document.createElement('span');
                    gotoFile.className = 'goto-file';
                    gotoFile.textContent = '👁️';
                    gotoFile.title = log.filePath ? 'Go to this log in file' : 'File path not available';
                    if (!log.filePath) {
                        gotoFile.dataset.disabled = 'true';
                    } else {
                        gotoFile.addEventListener('click', (e) => {
                            e.stopPropagation();
                            vscode.postMessage({
                                command: 'openLogFile',
                                path: log.filePath,
                                line: log.lineNumber
                            });
                        });
                    }

                    div.appendChild(timestamp);
                    div.appendChild(logger);
                    div.appendChild(level);
                    div.appendChild(message);
                    div.appendChild(gotoFile);

                    // Add click handlers
                    timestamp.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (log.filePath) {
                            vscode.postMessage({
                                command: 'openLogFile',
                                path: log.filePath,
                                line: log.lineNumber
                            });
                        }
                    });

                    div.addEventListener('click', () => {
                        if (log.raw && log.raw !== log.message) {
                            const isExpanding = !div.classList.contains('expanded');
                            div.classList.toggle('expanded');

                            // Update message content
                            message.textContent = isExpanding ? log.raw : log.message;

                            // Calculate new height
                            const lines = log.raw.split('\\n').length;
                            const newHeight = isExpanding ? Math.max(40, lines * 20) : 40; // 20px per line

                            // Track expansion state
                            const index = parseInt(div.dataset.index);
                            if (isExpanding) {
                                expandedEntries.set(index, newHeight);
                            } else {
                                expandedEntries.delete(index);
                            }

                            // Update the UI
                            renderVisibleLogs();

                            // Ensure the clicked entry remains visible
                            const entryTop = getEntryTop(index);
                            if (entryTop < scrollTop) {
                                virtualScroller.scrollTop = entryTop;
                            }
                        }
                    });

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
                // Clear expansions when filtering
                expandedEntries.clear();
            });

            document.getElementById('loggerFilter').addEventListener('change', (e) => {
                vscode.postMessage({
                    command: 'filterLogs',
                    logger: e.target.value
                });
                // Clear expansions when filtering
                expandedEntries.clear();
            });

            document.getElementById('clearFilters').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'clearFilters'
                });
                // Clear expansions when clearing filters
                expandedEntries.clear();
            });

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateLogs':
                        logs = message.logs;
                        // Clear expansions on log updates
                        expandedEntries.clear();
                        renderVisibleLogs();
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}
