export const FILTER_STYLES = `
    .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .filter-group label {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    input[type="text"], select, button {
        height: 24px;
        font-size: 11px;
        border-radius: 2px;
    }

    input[type="text"], select {
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-dropdown-border);
        padding: 0 8px;
    }

    input[type="text"] {
        min-width: 200px;
    }

    select {
        min-width: 120px;
        padding-right: 24px;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='%23C5C5C5' d='M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 6px center;
    }

    input[type="text"]:focus, select:focus {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: -1px;
    }

    button {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        padding: 0 10px;
        min-width: 80px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    button:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
`;
