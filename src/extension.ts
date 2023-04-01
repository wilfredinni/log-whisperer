import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "log-whisperer" is now active!');

  let disposable = vscode.commands.registerCommand(
    "log-whisperer.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from log-whisperer!");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
