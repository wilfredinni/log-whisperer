import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "log-whisperer" is now active!');

  let selectLogFolder = vscode.commands.registerCommand(
    "log-whisperer.selectLogFolder",
    () => {
      const selectPath = vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: true,
        openLabel: "Select log folder",
      });

      // get the path of the selected folder
      selectPath.then((value) => {
        if (value) {
          const folderPath = value[0].fsPath;

          // get logFolders from the workspace settings
          const logFolders = vscode.workspace
            .getConfiguration("log-whisperer")
            .get("logFolders");

          // update logFolders in the workspace settings and push the new folder path
          if (Array.isArray(logFolders) && !logFolders.includes(folderPath)) {
            const newLogFolders = logFolders;
            newLogFolders.push(folderPath);
            vscode.workspace
              .getConfiguration("log-whisperer")
              .update(
                "logFolders",
                newLogFolders,
                vscode.ConfigurationTarget.Workspace
              );

            // get the last folder in the path
            const folderName = folderPath.split("/").pop();
            vscode.window.showInformationMessage(
              `A new path was added to logFolders settings: ../${folderName}`
            );
          }
        }
      });
    }
  );

  context.subscriptions.push(selectLogFolder);
}

export function deactivate() {}
