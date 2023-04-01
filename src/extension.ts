import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "log-whisperer" is now active!');

  let selectLogFolder = vscode.commands.registerCommand(
    "log-whisperer.selectLogFolder",
    () => {
      const folderPath = vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: true,
        openLabel: "Select log folder",
      });

      // get the path of the selected folder
      folderPath.then((value) => {
        if (value) {
          const folderPath = value[0].fsPath;
          vscode.window.showInformationMessage(folderPath);
          console.log(folderPath);
        }
      });

      // save the path in the workspace settings
      vscode.workspace
        .getConfiguration("log-whisperer")
        .update("logFolder", folderPath, vscode.ConfigurationTarget.Workspace);
    }
  );

  context.subscriptions.push(selectLogFolder);
}

export function deactivate() {}
