import { LogEntry, LogStats, LogFilters } from "../models/types";

// CSS Templates
const BASE_STYLES = `
    body {
        font-family: var(--vscode-font-family);
        padding: 0;
        margin: 0;
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
    }
    .stats {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 8px 16px;
        background: var(--vscode-sideBar-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        font-size: var(--vscode-font-size);
    }
    .stats h3 {
        margin: 0 0 8px 0;
        font-size: var(--vscode-font-size);
        font-weight: 600;
        color: var(--vscode-sideBarTitle-foreground);
    }
    .stats p {
        margin: 0 0 8px 0;
        opacity: 0.8;
    }
    .stats-levels {
        display: flex;
        gap: 16px;
        font-size: 12px;
    }
    .filters {
        position: sticky;
        top: 85px;
        z-index: 99;
        padding: 8px 16px;
        background: var(--vscode-sideBar-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }
`;

const LOG_ENTRY_STYLES = `
    .log-entries {
        position: relative;
    }
    .log-entry {
        position: absolute;
        left: 0;
        right: 0;
        min-height: 40px;
        padding: 6px 16px;
        box-sizing: border-box;
        background: var(--vscode-editor-background);
        border-left: 3px solid transparent;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.1s ease;
    }
    .log-entry:hover {
        background: var(--vscode-list-hoverBackground);
    }
    .log-entry:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }
    .timestamp {
        color: var(--vscode-textPreformat-foreground);
        white-space: nowrap;
        cursor: pointer;
        opacity: 0.8;
    }
    .timestamp:hover {
        text-decoration: underline;
        opacity: 1;
    }
    .logger {
        color: var(--vscode-textLink-foreground);
        white-space: nowrap;
        font-weight: 500;
    }
    .level {
        white-space: nowrap;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 500;
    }
    .message {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: 0.9;
    }
`;

const FILTER_STYLES = `
    .filter-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .filter-group label {
        font-size: 11px;
        opacity: 0.8;
    }
    select {
        background: var(--vscode-dropdown-background);
        color: var(--vscode-dropdown-foreground);
        border: 1px solid var(--vscode-dropdown-border);
        padding: 2px 20px 2px 6px;
        font-size: 11px;
        border-radius: 2px;
        height: 24px;
        min-width: 120px;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='%23C5C5C5' d='M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 4px center;
    }
    select:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }
    button {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 2px 8px;
        border-radius: 2px;
        cursor: pointer;
        height: 24px;
        font-size: 11px;
        display: flex;
        align-items: center;
    }
    button:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    .goto-file {
        display: flex;
        align-items: center;
        opacity: 0.6;
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
    }
    .goto-file:hover {
        opacity: 1;
        background: var(--vscode-toolbar-hoverBackground);
    }
    .goto-file[data-disabled] {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

// Helper functions
function generateStatsHTML(stats: LogStats): string {
  return `
        <div class="stats">
            <h3>Log Statistics</h3>
            <p>Showing ${stats.totalEntries} entries</p>
            <div style="display: flex; gap: 20px;">
                ${Object.entries(stats.byLevel)
                  .map(([level, count]) => `<div>${level}: ${count}</div>`)
                  .join("")}
            </div>
        </div>
    `;
}

function generateFiltersHTML(stats: LogStats, filters: LogFilters): string {
  return `
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
    `;
}

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
            ${BASE_STYLES}
            ${LOG_ENTRY_STYLES}
            ${FILTER_STYLES}
        </style>
    </head>
    <body>
        ${generateStatsHTML(stats)}
        ${generateFiltersHTML(stats, filters)}

        <div class="virtual-scroll-container" id="virtualScroller">
            <div class="log-entries" id="logEntries"></div>
        </div>

        <script>
            // Constants and Initialization
            const vscode = acquireVsCodeApi();
            const ROW_HEIGHT = 40;
            const BUFFER_SIZE = 50;
            let logs = ${JSON.stringify(logs)};
            const virtualScroller = document.getElementById('virtualScroller');
            const logEntriesContainer = document.getElementById('logEntries');

            // Helper Functions
            function getEntryTop(index) {
                let top = index * ROW_HEIGHT;
                for (const [expandedIdx, height] of expandedEntries.entries()) {
                    if (expandedIdx < index) {
                        top += (height - ROW_HEIGHT);
                    }
                }
                return top;
            }

            function createLogEntryElement(log, index) {
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.style.top = \`\${getEntryTop(index)}px\`;
                div.dataset.index = index;

                if (expandedEntries.has(index)) {
                    div.classList.add('expanded');
                    div.style.height = \`\${expandedEntries.get(index)}px\`;
                }

                div.style.borderLeftColor = getLogLevelColor(log.level);

                // Create entry components
                const gotoFile = createGotoFileElement(log);
                const timestamp = createTimestampElement(log);
                const logger = createLoggerElement(log);
                const level = createLevelElement(log);
                const message = createMessageElement(log, index);

                // Assemble entry with gotoFile first
                div.appendChild(gotoFile);
                div.appendChild(timestamp);
                div.appendChild(logger);
                div.appendChild(level);
                div.appendChild(message);

                // Add event handlers
                addEntryEventHandlers(div, log, index);

                return div;
            }

            function createTimestampElement(log) {
                const timestamp = document.createElement('span');
                timestamp.className = 'timestamp';
                timestamp.textContent = \`[\${log.timestamp}]\`;
                timestamp.title = 'Click to open file at this log line';
                return timestamp;
            }

            function createLoggerElement(log) {
                const logger = document.createElement('span');
                logger.className = 'logger';
                logger.textContent = log.logger;
                return logger;
            }

            function createLevelElement(log) {
                const level = document.createElement('span');
                level.className = 'level';
                level.style.color = getLogLevelColor(log.level);
                level.textContent = log.level;
                return level;
            }

            function createMessageElement(log, index) {
                const message = document.createElement('span');
                message.className = 'message';
                message.textContent = log.raw || log.message;
                return message;
            }

            function createGotoFileElement(log) {
                const gotoFile = document.createElement('span');
                gotoFile.className = 'goto-file';
                gotoFile.innerHTML = [
                    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle;">',
                    '<path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" ',
                    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                    '<path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                    '<path d="M14 2L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                    '</svg>'
                ].join('');
                gotoFile.title = log.filePath ? 'Open file at line ' + log.lineNumber : 'File path not available';

                if (log.filePath) {
                    gotoFile.addEventListener('click', (e) => {
                        e.stopPropagation();
                        vscode.postMessage({
                            command: 'openLogFile',
                            path: log.filePath,
                            line: log.lineNumber
                        });
                    });
                } else {
                    gotoFile.dataset.disabled = 'true';
                }
                return gotoFile;
            }

            function addEntryEventHandlers(div, log, index) {
                // Timestamp click handler
                div.querySelector('.timestamp').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (log.filePath) {
                        vscode.postMessage({
                            command: 'openLogFile',
                            path: log.filePath,
                            line: log.lineNumber
                        });
                    }
                });

            }


            function renderVisibleLogs() {
                logEntriesContainer.innerHTML = '';
                
                // Calculate container height based on number of logs
                logEntriesContainer.style.height = \`\${logs.length * ROW_HEIGHT}px\`;
                
                logs.forEach((log, index) => {
                    const div = document.createElement('div');
                    div.className = 'log-entry';
                    div.style.top = \`\${index * ROW_HEIGHT}px\`;
                    div.style.height = \`\${ROW_HEIGHT}px\`;
                    div.style.borderLeftColor = getLogLevelColor(log.level);
                    
                    div.innerHTML = \`
                        \${log.filePath ? '<span class="goto-file" title="Open file at line ' + log.lineNumber + '">' + [
                            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align:middle">',
                            '<path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" ',
                            'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                            '<path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                            '<path d="M14 2L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
                            '</svg>'
                        ].join('') + '</span>' : ''}
                        <span class="timestamp">[\${log.timestamp}]</span>
                        <span class="logger">\${log.logger}</span>
                        <span class="level" style="color: \${getLogLevelColor(log.level)}">\${log.level}</span>
                        <span class="message">\${log.message}</span>
                    \`;
                    
                    if (log.filePath) {
                        div.querySelector('.goto-file').addEventListener('click', (e) => {
                            e.stopPropagation();
                            vscode.postMessage({
                                command: 'openLogFile',
                                path: log.filePath,
                                line: log.lineNumber
                            });
                        });
                    }
                    
                    logEntriesContainer.appendChild(div);
                });
            }

            function calculateVisibleRange(scrollTop, containerHeight) {
                let startIdx = 0;
                let currentHeight = 0;
                let endIdx = 0;
                let visibleHeight = 0;

                // Find start index
                for (let i = 0; i < logs.length; i++) {
                    if (currentHeight + ROW_HEIGHT > scrollTop - ROW_HEIGHT * BUFFER_SIZE) {
                        startIdx = i;
                        break;
                    }
                    currentHeight += entryHeight;
                }

                // Find end index
                endIdx = startIdx;
                while (endIdx < logs.length && visibleHeight < containerHeight + ROW_HEIGHT * BUFFER_SIZE * 2) {
                    visibleHeight += ROW_HEIGHT;
                    endIdx++;
                }

                return { startIdx, endIdx };
            }

            function getLogLevelColor(level) {
                switch (level.toLowerCase()) {
                    case 'error': return '#ff0000';
                    case 'warning': return '#ffa500';
                    case 'info': return '#00ff00';
                    default: return '#ffffff';
                }
            }

            // Event Listeners
            function setupEventListeners() {
                let scrollTimeout;
                virtualScroller.addEventListener('scroll', () => {
                    if (scrollTimeout) {
                        cancelAnimationFrame(scrollTimeout);
                    }
                    scrollTimeout = requestAnimationFrame(renderVisibleLogs);
                });

                document.getElementById('levelFilter').addEventListener('change', (e) => {
                    handleFilterChange('level', e.target.value);
                });

                document.getElementById('loggerFilter').addEventListener('change', (e) => {
                    handleFilterChange('logger', e.target.value);
                });

                document.getElementById('clearFilters').addEventListener('click', () => {
                    vscode.postMessage({ command: 'clearFilters' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'updateLogs') {
                        logs = message.logs;
                        renderVisibleLogs();
                    }
                });
            }

            function handleFilterChange(type, value) {
                vscode.postMessage({
                    command: 'filterLogs',
                    [type]: value
                });
                expandedEntries.clear();
            }

            // Initialize
            setupEventListeners();
            renderVisibleLogs();
        </script>
    </body>
    </html>`;
}
