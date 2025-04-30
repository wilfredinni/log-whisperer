# Change Log

## [0.0.2] - 2025-04-29

This release introduces a new file watcher feature for the `LogExplorerViewProvider`, improves the webview's layout and styling, and adds a reusable `debounce` utility function. These changes enhance functionality, performance, and maintainability.

### New File Watcher Feature:

- Added a file watcher in `LogExplorerViewProvider` to monitor `.log` files for changes, creation, and deletion. This includes debounced handling of file updates and automatic updates to the webview.

### Utility Enhancements:

- Introduced a reusable `debounce` function in `src/utils/helpers.ts` for managing delayed execution of functions. This is used in the file watcher to optimize performance.

### Webview Layout and Styling Improvements:

- Updated the webview's HTML structure to include separate containers for stats and filters, improving organization.

### Code Maintenance:

- Changed imports in `sidebarProvider.ts` and `panel.ts` to use `type` for type-only imports, aligning with best practices.

## [0.0.1] - 2025-04-27

### Added

- Initial release of Log Whisperer extension
- Log file scanning and parsing functionality
- Sidebar view showing log file statistics:
  - Total log count per file
  - Breakdown by log level (FATAL, ERROR, WARNING, INFO, DEBUG, TRACE)
- Ability to open log files in editor
- Refresh functionality to rescan workspace
- VS Code theme-aware UI styling
