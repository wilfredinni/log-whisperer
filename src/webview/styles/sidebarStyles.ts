export const SIDEBAR_STYLES = `
    body {
        padding: 0;
        margin: 0;
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: var(--vscode-sideBar-background);
    }
    .container {
        padding: 0 12px;
    }
    .toolbar {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 1px 27px;
        margin: 0 -12px 12px;
        background: var(--vscode-sideBar-background);
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .toolbar h3 {
        margin: 0;
        font-size: var(--vscode-font-size);
        font-weight: 600;
        color: var(--vscode-sideBarTitle-foreground);
        opacity: 0.9;
    }
    .refresh-button {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 4px 8px;
        border-radius: 2px;
        cursor: pointer;
        font-size: 11px;
        height: 24px;
    }
    .refresh-button:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    .log-files {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .log-file {
        background: var(--vscode-list-inactiveSelectionBackground);
        border-radius: 4px;
        border: 1px solid var(--vscode-widget-border);
        transition: all 0.1s ease;
    }
    .log-file:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }
    .file-header {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }
    .file-name-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    .file-name {
        font-weight: 500;
        color: var(--vscode-editor-foreground);
        font-size: 12px;
    }
    .total-count {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: normal;
    }
    .log-badges {
        display: flex;
        gap: 0;
        width: 100%;
        padding: 0;
        margin: 0;
    }
    .log-badge {
        display: flex;
        align-items: center;
        padding: 2px 0;
        border-radius: 0;
        font-size: 10px;
        font-weight: 600;
        height: 14px;
        justify-content: center;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .log-badge[data-has-logs="true"] {
        opacity: 1;
    }
    .log-badge:first-child {
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
    }
    .log-badge:last-child {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
    }
    .log-badge.fatal {
        background-color: #cc0000;
        color: #ffffff;
    }
    .log-badge.error {
        background-color: var(--vscode-errorForeground);
        color: var(--vscode-editor-background);
    }
    .log-badge.warning {
        background-color: var(--vscode-problemsWarningIcon-foreground);
        color: var(--vscode-editor-background);
    }
    .log-badge.info {
        background-color: var(--vscode-notificationsInfoIcon-foreground);
        color: var(--vscode-editor-background);
    }
    .log-badge.debug {
        background-color: var(--vscode-debugIcon-startForeground);
        color: var(--vscode-editor-background);
    }
    .log-badge.trace {
        background-color: var(--vscode-charts-purple);
        color: var(--vscode-editor-background);
    }
    .log-badge.other {
        background-color: var(--vscode-descriptionForeground);
        color: var(--vscode-editor-background);
    }
    .empty-state {
        padding: 24px 16px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
    }
`;
