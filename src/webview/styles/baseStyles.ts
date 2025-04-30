export const BASE_STYLES = `
    body {
        padding: 0;
        margin: 0;
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        font-size: var(--vscode-font-size);
        overflow: hidden;
        height: 100vh;
    }

    .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .header {
        background: var(--vscode-editor-background);
        border-bottom: thin solid var(--vscode-panel-border);
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .stats-container {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 16px;
    }

    .stats {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .stats-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 8px;
    }

    .stats-header h3 {
        margin: 0;
        font-size: 11px;
        font-weight: normal;
        color: var(--vscode-foreground);
        opacity: 0.8;
    }

    .stats-total {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .stats-levels {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        align-items: center;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
    }

    .level-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .stat-count {
        font-weight: 600;
    }

    .stat-label {
        color: var(--vscode-descriptionForeground);
    }

    .filters {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .filter-group label {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    input[type="text"], select, button {
        height: 24px;
        font-size: 11px;
        border-radius: 2px;
        min-width: 120px;
    }

    input[type="text"], select {
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid transparent;
        padding: 0 6px;
    }

    input[type="text"] {
        min-width: 200px;
    }

    select {
        padding-right: 24px;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='%23C5C5C5' d='M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 6px center;
    }

    input[type="text"]:focus, select:focus {
        outline: 1px solid var(--vscode-focusBorder);
        border-color: transparent;
    }

    button {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        padding: 0 12px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: auto;
    }

    button:hover {
        color: var(--vscode-textLink-activeForeground);
        text-decoration: underline;
    }

    .table-container {
        flex: 1;
        overflow: auto;
        position: relative;
        padding-bottom: 16px;
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
        font-size: 11px;
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
        font-size: var(--vscode-font-size);
        font-family: var(--vscode-editor-font-family);
        border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
    }

    .log-table tr:hover {
        background: var(--vscode-list-hoverBackground);
    }

    .log-table tr:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }

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

    .col-message {
        width: 100%;
    }

    .col-timestamp,
    .col-level,
    .col-logger {
        width: auto;
        overflow: visible;
    }

    td.col-message {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .level-indicator {
        display: inline-flex;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        margin-right: 8px;
    }

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

    .level-badge[data-level="fatal"] {
        background-color: #cc0000;
        color: #ffffff;
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

    .level-badge[data-level="debug"] {
        background-color: var(--vscode-debugIcon-startForeground);
        color: var(--vscode-editor-background);
    }

    .level-badge[data-level="trace"] {
        background-color: var(--vscode-charts-purple);
        color: var(--vscode-editor-background);
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        text-align: center;
        height: 100%;
    }

    .empty-state-icon {
        margin-bottom: 16px;
        opacity: 0.5;
    }
`;
