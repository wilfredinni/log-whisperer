import { LogEntry, LogStats, LogFilters } from "../models/types";
import { BASE_STYLES } from "./styles/baseStyles";
import { FILTER_STYLES } from "./styles/filterStyles";
import { generateStatsHTML, generateFiltersHTML } from "./helpers/logHelpers";

export function getWebviewContent(
  logs: LogEntry[],
  stats: LogStats,
  filters: LogFilters
): string {
  const generateStatsHTMLClient = `function generateStatsHTML(stats) {
        return \`
            <div class="stats">
                <div class="stats-header">
                    <h3>Log Statistics</h3>
                    <span class="stats-total">\${stats.totalEntries} logs</span>
                </div>
                <div class="stats-levels">
                    \${Object.entries(stats.totalByLevel)
                        .map(([level, count]) =>
                            \`<div class="stat-item">
                                <span class="level-dot" style="background: \${getLogLevelColor(level)}"></span>
                                <span class="stat-count">\${count}</span>
                                <span class="stat-label">\${level}</span>
                            </div>\`)
                        .join('')}
                </div>
            </div>
        \`;
    }`;

  const generateFiltersHTMLClient = `function generateFiltersHTML(stats, filters) {
        return \`
            <div class="filters">
                <div class="filter-group">
                    <label>Search:</label>
                    <input type="text" id="searchFilter" placeholder="Search in level, logger, message..." value="\${filters.search || ''}" />
                </div>
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
                <div class="stats-container">
                    ${generateStatsHTML(stats)}
                    <div class="stream-toggle">
                        <label>Stream</label>
                        <input type="checkbox" id="streamToggle">
                    </div>
                </div>
                <div class="filters-container">
                    ${generateFiltersHTML(stats, filters)}
                </div>
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
            let currentLogs = ${JSON.stringify(logs)};
            let currentStats = ${JSON.stringify(stats)};
            let currentFilters = ${JSON.stringify(filters)};

            function getLogLevelColor(level) {
                switch (level.toLowerCase()) {
                    case "fatal":
                        return "var(--vscode-testing-message-error-decorationForeground)";
                    case "error":
                        return "var(--vscode-errorForeground)";
                    case "warning":
                        return "var(--vscode-problemsWarningIcon-foreground)";
                    case "info":
                        return "var(--vscode-notificationsInfoIcon-foreground)";
                    case "debug":
                        return "var(--vscode-debugIcon-startForeground)";
                    case "trace":
                        return "var(--vscode-charts-purple)";
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
                            <span class="level-badge" data-level="\${log.level.toLowerCase()}" title="\${log.level}">\${log.level}</span>
                        </td>
                        <td class="col-logger">\${log.logger}</td>
                        <td class="col-message">\${log.message}</td>
                    </tr>\`;
            }

            function updateUI() {
                // Update table
                const tableBody = document.getElementById('logTableBody');
                if (tableBody) {
                    if (currentLogs.length === 0) {
                        const hasFilters = Boolean(currentFilters.level || currentFilters.logger || currentFilters.search);
                        tableBody.innerHTML = \`
                            <tr>
                                <td colspan="5">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M4 19H20V12H22V20C22 20.2652 21.8946 20.5196 21.7071 20.7071C21.5196 20.8946 21.2652 21 21 21H3C2.73478 21 2.48043 20.8946 2.29289 20.7071C2.10536 20.5196 2 20.2652 2 20V12H4V19ZM13 9V15H11V9H13ZM12 4L21 10H3L12 4Z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        No logs to display
                                        \${hasFilters ? '<br>Try adjusting or clearing your filters' : ''}
                                    </div>
                                </td>
                            </tr>
                        \`;
                    } else {
                        tableBody.innerHTML = currentLogs.map((log, index) => renderLogRow(log, index)).join('');
                    }
                }

                // Update stats and filters section
                const statsAndFilters = document.getElementById('statsAndFilters');
                if (statsAndFilters) {
                    statsAndFilters.innerHTML = generateStatsHTML(currentStats) + generateFiltersHTML(currentStats, currentFilters);
                }

                // Setup filter event listeners
                setupFilterEventListeners();
            }

            function setupFilterEventListeners() {
                const levelFilter = document.getElementById('levelFilter');
                const loggerFilter = document.getElementById('loggerFilter');
                const searchFilter = document.getElementById('searchFilter');
                const clearFiltersBtn = document.getElementById('clearFilters');

                if (levelFilter) {
                    levelFilter.value = currentFilters.level || '';
                    levelFilter.addEventListener('change', (e) => {
                        vscode.postMessage({
                            command: 'filterLogs',
                            level: e.target.value
                        });
                    });
                }

                if (loggerFilter) {
                    loggerFilter.value = currentFilters.logger || '';
                    loggerFilter.addEventListener('change', (e) => {
                        vscode.postMessage({
                            command: 'filterLogs',
                            logger: e.target.value
                        });
                    });
                }

                if (searchFilter) {
                    searchFilter.value = currentFilters.search || '';
                    let searchTimeout;
                    searchFilter.addEventListener('input', (e) => {
                        clearTimeout(searchTimeout);
                        searchTimeout = setTimeout(() => {
                            vscode.postMessage({
                                command: 'filterLogs',
                                search: e.target.value
                            });
                        }, 300);
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
            updateUI();

            // Handle messages from the extension
            window.addEventListener('message', (event) => {
                const message = event.data;
                if (message.command === 'updateLogs') {
                    currentLogs = message.logs;
                    currentStats = message.stats;
                    currentFilters = message.filters || {};
                    updateUI();
                }
            });
        </script>
    </body>
    </html>`;
}
