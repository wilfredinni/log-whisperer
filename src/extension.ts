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

            // open all the log files in the selected folder
            vscode.workspace
              .findFiles(`**/${folderName}/**/*.log`)
              .then((uris) => {
                if (uris) {
                  uris.forEach((uri) => {
                    vscode.workspace.openTextDocument(uri).then((doc) => {
                      const {
                        startWithDatePattern,
                        logLevelPattern,
                        datePattern,
                      } = require("./patterns");

                      const text = doc.getText();
                      const matches = text.match(startWithDatePattern);
                      const logIndexes: any = [];

                      if (matches) {
                        matches.forEach((matchedText) => {
                          const logLevel = matchedText.match(logLevelPattern);
                          const date = matchedText.match(datePattern);

                          logIndexes.push({
                            date: date ? date[0] : "no date found",
                            level: logLevel ? logLevel[0] : "INFO",
                            file: doc.fileName,
                            match: matchedText,
                          });
                        });
                      }
                      console.log(logIndexes);
                      // save the logIndexes in an external file
                      vscode.workspace.fs.writeFile(
                        vscode.Uri.file(
                          `../log-whisperer/${folderName}/logIndexes.json`
                        ),
                        Buffer.from(JSON.stringify(logIndexes))
                      );
                    });
                  });
                }
              });
          }
        }
      });
    }
  );

  context.subscriptions.push(selectLogFolder);
}

export function deactivate() {}
