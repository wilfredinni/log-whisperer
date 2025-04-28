# Log Whisperer

A powerful VS Code extension for analyzing and exploring log files with ease. Log Whisperer provides an intuitive interface to view, filter, and analyze your application logs directly within VS Code.

![Log Whisperer](/media/SCR-20250427-sgny.png)

## Features

- **Log File Explorer**: Automatically discovers and lists all log files in your workspace
- **Real-time Statistics**: View log statistics including error counts, warning counts, and info messages at a glance
- **Advanced Filtering**: Filter logs by:
  - Log level (ERROR, WARNING, INFO, etc.)
  - Logger/Source
  - Free text search across all log fields
- **Interactive UI**:
  - Click on log entries to jump directly to their location in the source file
  - Clear visual indicators for different log levels
  - Collapsible sidebar view for easy navigation
- **Performance Optimized**:
  - Handles large log files efficiently
  - Progressive loading and filtering
  - Non-blocking UI updates

## Usage

1. Open a workspace containing log files (`.log` extension)
2. Click on the Log Whisperer icon in the activity bar to open the log explorer
3. Click "Refresh" to scan for log files if they don't appear automatically
4. Click on any log file to open the detailed view
5. Use the filters at the top to narrow down the logs:
   - Search box for free text search
   - Level dropdown to filter by log level
   - Logger dropdown to filter by source
6. Click on the file icon next to any log entry to jump to its location in the source file

## Log Format Support

The extension currently supports log files in the following format:

```
YYYY-MM-DD HH:mm:ss,SSS LOGGER LEVEL Message
```

Example:

```
2024-04-27 10:15:30,123 com.app.service INFO Starting service...
```

## Requirements

- Visual Studio Code version 1.60.0 or higher

## Extension Settings

This extension contributes the following settings:

- `logWhisperer.maxFileSize`: Maximum file size (in MB) for log files to be processed
- `logWhisperer.autoRefresh`: Enable/disable automatic refresh of log files when changes are detected

## Known Issues

No known issues at this time. If you encounter any problems, please report them on our GitHub repository.

## Release Notes

### 0.0.1

Initial release of Log Whisperer:

- Log file discovery and parsing
- Interactive log viewer with filtering
- Real-time statistics
- Jump to source functionality
