import { LogEntry, LogStats, LogFilters } from "../models/types";

// CSS Templates
const BASE_STYLES = `
    body {
        padding: 0;
        margin: 0;
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-editor-foreground);
        background: var(--vscode-editor-background);
        font-size: var(--vscode-editor-font-size);
        overflow: hidden;
        height: 100vh;
    }

    .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-bottom: 1px solid var(--vscode-editorGroup-border);
    }

    .stats {
        padding: 8px 12px;
        font-size: 11px;
    }

    .stats h3 {
        margin: 0 0 6px 0;
        font-size: 11px;
        font-weight: 400;
        text-transform: uppercase;
        color: var(--vscode-sideBarTitle-foreground);
        letter-spacing: 0.04em;
    }

    .stats-total {
        margin: 0 0 6px 0;
        font-size: 11px;
        font-weight: 400;
        color: var(--vscode-sideBarTitle-foreground);
        letter-spacing: 0.04em;
    }

    .filters {
        padding: 6px 12px;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--vscode-editorGroup-border);
    }

    .table-container {
        flex: 1;
        overflow: auto;
        position: relative;
        padding-bottom: 16px; /* Add some bottom padding for better scrolling experience */
    }

    .log-table {
        width: max-content;
        min-width: 100%;
        table-layout: auto;
        border-collapse: collapse;
        border-spacing: 0;
    }

    .log-table-header {
        position: sticky;
        top: 0;
        z-index: 2;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        border-bottom: 1px solid var(--vscode-editorGroup-border);
    }

    .log-table th,
    .log-table td {
        padding: 4px 8px;
        border-right: 1px solid var(--vscode-editorGroup-border);
        white-space: nowrap;
    }

    .log-table th {
        position: sticky;
        top: 0;
        font-weight: 400;
        text-align: left;
        font-size: 11px;
        color: var(--vscode-foreground);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        user-select: none;
        background: var(--vscode-editorGroupHeader-tabsBackground);
        z-index: 2;
    }

    .log-table td {
        font-size: var(--vscode-editor-font-size);
        border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
    }

    .log-table tr:hover {
        background: var(--vscode-list-hoverBackground);
    }

    .log-table tr:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }

    /* Column widths - updated for proper auto-growing */
    .col-actions {
        width: 30px;
        min-width: 30px;
        max-width: 30px;
    }

    .col-timestamp {
        min-width: 140px;
    }

    .col-level {
        min-width: 70px;
    }

    .col-logger {
        min-width: 100px;
    }

    .col-message {
        min-width: 200px;
    }

    /* Make message column take remaining space while allowing table to scroll horizontally */
    .col-message {
        width: 100%;
    }

    /* Ensure the table container allows horizontal scrolling */
    .table-container {
        flex: 1;
        overflow: auto;
        position: relative;
        padding-bottom: 16px; /* Add some bottom padding for better scrolling experience */
    }

    /* Remove fixed widths and overflow constraints from cells that should grow */
    .col-timestamp,
    .col-level,
    .col-logger {
        width: auto;
        overflow: visible;
    }

    /* Keep message column with ellipsis */
    td.col-message {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Level indicators */
    .level-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
    }

    /* Level badge styling */
    .level-badge {
        display: inline-flex;
        align-items: center;
        padding: 0 6px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        height: 18px;
    }

    .level-badge[data-level="error"] {
        background-color: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
    }

    .level-badge[data-level="warning"] {
        background-color: var(--vscode-problemsWarningIcon-foreground);
        color: var(--vscode-editor-background);
    }

    .level-badge[data-level="info"] {
        background-color: var(--vscode-notificationsInfoIcon-foreground);
        color: var(--vscode-editor-background);
    }

    .level-badge[data-level="debug"],
    .level-badge[data-level="trace"] {
        background-color: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
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
        padding: 0 20px 0 6px;
        font-size: 11px;
        border-radius: 2px;
        height: 22px;
        min-width: 100px;
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
        height: 22px;
        font-size: 11px;
        display: flex;
        align-items: center;
    }
    button:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
`;

// Helper functions
function generateStatsHTML(stats: LogStats): string {
  return `
        <div class="stats">
            <h3>Log Statistics</h3>
            <p class="stats-total">Showing ${stats.totalEntries} logs</p>
            <div class="stats-levels">
                ${Object.entries(stats.totalByLevel)
                  .map(
                    ([level, count]) =>
                      `<div><span class="level-indicator" style="background: ${getLogLevelColor(
                        level
                      )}"></span>${level}: ${count}</div>`
                  )
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
                    <option value="">All Levels</option>
                    ${stats.allLevels
                      .map(
                        (level) =>
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
                    <option value="">All Loggers</option>
                    ${stats.allLoggers
                      .map(
                        (logger) =>
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

function getLogLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "error":
      return "var(--vscode-errorForeground)";
    case "warning":
      return "var(--vscode-problemsWarningIcon-foreground)";
    case "info":
      return "var(--vscode-notificationsInfoIcon-foreground)";
    default:
      return "var(--vscode-foreground)";
  }
}

export function getWebviewContent(
  logs: LogEntry[],
  stats: LogStats,
  filters: LogFilters
): string {
  const generateStatsHTMLClient = `function generateStatsHTML(stats) {
        return \`
            <div class="stats">
                <h3>Log Statistics</h3>
                <p class="stats-total">Showing \${stats.totalEntries} logs</p>
                <div class="stats-levels">
                    \${Object.entries(stats.totalByLevel)
                        .map(([level, count]) => 
                            \`<div><span class="level-indicator" style="background: \${getLogLevelColor(level)}"></span>\${level}: \${count}</div>\`)
                        .join('')}
                </div>
            </div>
        \`;
    }`;

  const generateFiltersHTMLClient = `function generateFiltersHTML(stats, filters) {
        return \`
            <div class="filters">
                <div class="filter-group">
                    <label>Level:</label>
                    <select id="levelFilter">
                        <option value="">All Levels</option>
                        \${stats.allLevels
                            .map(level => 
                                \`<option value="\${level}" \${filters.level === level ? 'selected' : ''}>\${level}</option>\`)
                            .join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Logger:</label>
                    <select id="loggerFilter">
                        <option value="">All Loggers</option>
                        \${stats.allLoggers
                            .map(logger => 
                                \`<option value="\${logger}" \${filters.logger === logger ? 'selected' : ''}>\${logger}</option>\`)
                            .join('')}
                    </select>
                </div>
                <button id="clearFilters">Clear Filters</button>
            </div>
        \`;
    }`;

  return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            ${BASE_STYLES}
            ${FILTER_STYLES}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header" id="statsAndFilters">
                ${generateStatsHTML(stats)}
                ${generateFiltersHTML(stats, filters)}
            </div>
            
            <div class="table-container">
                <table class="log-table">
                    <thead class="log-table-header">
                        <tr>
                            <th class="col-actions"></th>
                            <th class="col-timestamp">Timestamp</th>
                            <th class="col-level">Level</th>
                            <th class="col-logger">Logger</th>
                            <th class="col-message">Message</th>
                        </tr>
                    </thead>
                    <tbody id="logTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let logs = ${JSON.stringify(logs)};
            let currentStats = ${JSON.stringify(stats)};

            function getLogLevelColor(level) {
                switch (level.toLowerCase()) {
                    case "error":
                        return "var(--vscode-errorForeground)";
                    case "warning":
                        return "var(--vscode-problemsWarningIcon-foreground)";
                    case "info":
                        return "var(--vscode-notificationsInfoIcon-foreground)";
                    default:
                        return "var(--vscode-foreground)";
                }
            }
            
            ${generateStatsHTMLClient}
            ${generateFiltersHTMLClient}
            
            function renderLogRow(log, index) {
                const gotoFileButton = log.filePath 
                    ? \`<span class="goto-file" title="Open file at line \${log.lineNumber}" style="cursor: pointer; opacity: 0.6;" onclick="gotoFile('\${log.filePath}', \${log.lineNumber})">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10 2H14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>\`
                    : "";

                return \`
                    <tr data-index="\${index}">
                        <td class="col-actions">\${gotoFileButton}</td>
                        <td class="col-timestamp">\${log.timestamp}</td>
                        <td class="col-level">
                            <span class="level-badge" data-level="\${log.level.toLowerCase()}">\${log.level}</span>
                        </td>
                        <td class="col-logger">\${log.logger}</td>
                        <td class="col-message">\${log.message}</td>
                    </tr>\`;
            }

            function updateUI(logs, stats, filters) {
                // Update table
                const tableBody = document.getElementById('logTableBody');
                if (tableBody) {
                    tableBody.innerHTML = logs.map((log, index) => renderLogRow(log, index)).join('');
                }

                // Update stats and filters section
                const statsAndFilters = document.getElementById('statsAndFilters');
                if (statsAndFilters) {
                    statsAndFilters.innerHTML = generateStatsHTML(stats) + generateFiltersHTML(stats, filters);
                }

                // Reattach event listeners
                const levelFilter = document.getElementById('levelFilter');
                const loggerFilter = document.getElementById('loggerFilter');
                const clearFiltersBtn = document.getElementById('clearFilters');
                
                if (levelFilter) {
                    levelFilter.value = filters.level || '';
                    levelFilter.addEventListener('change', (e) => {
                        vscode.postMessage({
                            command: 'filterLogs',
                            level: e.target.value
                        });
                    });
                }
                
                if (loggerFilter) {
                    loggerFilter.value = filters.logger || '';
                    loggerFilter.addEventListener('change', (e) => {
                        vscode.postMessage({
                            command: 'filterLogs',
                            logger: e.target.value
                        });
                    });
                }

                if (clearFiltersBtn) {
                    clearFiltersBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'clearFilters' });
                    });
                }
            }

            function gotoFile(path, line) {
                vscode.postMessage({
                    command: 'openLogFile',
                    path: path,
                    line: line
                });
            }

            // Initial render
            updateUI(logs, currentStats, ${JSON.stringify(filters)});

            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateLogs') {
                    logs = message.logs;
                    currentStats = message.stats;
                    updateUI(logs, message.stats, message.filters || {});
                }
            });
        </script>
    </body>
    </html>`;
}
