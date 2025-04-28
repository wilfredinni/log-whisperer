import { LogStats, LogFilters } from "../../models/types";

export function generateStatsHTML(stats: LogStats): string {
  return `
        <div class="stats">
            <div class="stats-header">
                <h3>Log Statistics</h3>
                <span class="stats-total">${stats.totalEntries} logs</span>
            </div>
            <div class="stats-levels">
                ${Object.entries(stats.totalByLevel)
                  .map(
                    ([level, count]) => `
                        <div class="stat-item">
                            <span class="level-dot" style="background: ${getLogLevelColor(
                              level
                            )}"></span>
                            <span class="stat-count">${count}</span>
                            <span class="stat-label">${level}</span>
                        </div>
                    `
                  )
                  .join("")}
            </div>
        </div>
    `;
}

export function generateFiltersHTML(
  stats: LogStats,
  filters: LogFilters
): string {
  return `
        <div class="filters">
            <div class="filter-group">
                <label>Search:</label>
                <input type="text" id="searchFilter" placeholder="Search in level, logger, message..." value="${
                  filters.search || ""
                }" />
            </div>
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

export function getLogLevelColor(level: string): string {
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
