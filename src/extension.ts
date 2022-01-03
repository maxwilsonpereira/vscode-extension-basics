// the module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import axios from "axios"; // ADD "DOM" to "lib" at tsconfig.json
import * as path from "path";
import { getWebviewContent, getWebviewContentLocalData } from "./webviewHTML";

// activate() called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  // DEBUG: ctrl+shift+p --> Developer: Toggle Developer Tools

  console.log(
    'Congratulations! Your extension "vscode-extension" is now active!'
  );

  // commands defined at the package.json
  // now provide the implementation of the command with registerCommand
  // the commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.simpleCommand",
      (text = "This is a default text!") => {
        // the code you place here will be executed every time your command is executed
        vscode.window.showInformationMessage(text);
        console.log("Simple Command in action with text: ", text);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.answerQuestion",
      async () => {
        // showInformationMessage() returns a Thenable - it's like a promise:
        const answer = await vscode.window.showInformationMessage(
          "How was your day?",
          "good",
          "bad"
        );
        if (answer === "bad")
          vscode.window.showInformationMessage("Sorry to hear that");
        else
          console.log(
            "Answer can be seem on the parent DEBUG CONSOLE window!",
            { answer }
          );
      }
    )
  );

  // it will fetch only once, on the activation:
  const response = await axios.get(
    "https://jsonplaceholder.typicode.com/users"
  );
  const users = response.data.map((user: any) => {
    return {
      label: user.name,
      detail: user.email,
    };
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.showResults",
      async () => {
        // showQuickPick() will display users at the VsCode Command line
        const user = await vscode.window.showQuickPick(users, {
          matchOnDetail: true, // to also show the description
        });
        console.log("Users: ", users);
      }
    )
  );

  // WEBVIEW API
  // https://code.visualstudio.com/api/extension-guides/webview
  // a new webview will be opened any time the command runs:
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-extension.webviewShow", () => {
      // executing an extra command:
      vscode.commands.executeCommand(
        "vscode-extension.simpleCommand",
        "Webview content fetched!"
      );
      // create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "vscode-extension", // identifies the type of the webview; used internally
        "Webview Show", // title of the panel displayed to the user
        vscode.ViewColumn.One, // editor column to show the new webview panel in
        { enableScripts: true } // webview options
      );
      let iteration = 0;
      const updateWebview = () => {
        const cat = iteration++ % 2 ? "Compiling Cat" : "Coding Cat";
        panel.title = cat; // title of the document displayed in the editor
        // webview.html to update the webview content
        // https://code.visualstudio.com/api/extension-guides/webview#updating-webview-content
        panel.webview.html = getWebviewContent(cat);
      };
      updateWebview();
      setInterval(updateWebview, 3000);
      // after 15 sec, programmatically close the webview panel
      const timeout = setTimeout(() => panel.dispose(), 15000);
      panel.onDidDispose(
        () => {
          // Handle user closing panel before the 15 sec have passed
          clearTimeout(timeout);
        },
        null,
        context.subscriptions
      );
    })
  );

  // update contents based on view state changes
  // similar to "useEffect / componentDidChange"
  // *** NOT WORKING! DON'T KNOW WHY!
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-extension.webviewUpdate", () => {
      const panelB = vscode.window.createWebviewPanel(
        "vscode-extension", // identifies the type of the webview, used internally
        "Webview Update", // title of the panel displayed to the user
        vscode.ViewColumn.One,
        {}
      );
      panelB.webview.html = getWebviewContent("Coding Cat");
      // update contents based on view state changes
      panelB.onDidChangeViewState(
        (e) => {
          // execute a command:
          vscode.commands.executeCommand(
            "vscode-extension.simpleCommand",
            "onDidChangeViewState!"
          );
          const panelB = e.webviewPanel;
          switch (panelB.viewColumn) {
            case vscode.ViewColumn.One:
              updateWebviewForCat(panelB, "Coding Cat");
              return;
            case vscode.ViewColumn.Two:
              updateWebviewForCat(panelB, "Compiling Cat");
              return;
            case vscode.ViewColumn.Three:
              updateWebviewForCat(panelB, "Testing Cat");
              return;
          }
        },
        null,
        context.subscriptions
      );
    })
  );
  function updateWebviewForCat(panelB: vscode.WebviewPanel, catName: string) {
    panelB.title = catName;
    panelB.webview.html = getWebviewContent(catName);
  }

  // LOADING LOCAL CONTENT (local image) with Webview.asWebviewUri()
  // https://code.visualstudio.com/api/extension-guides/webview#loading-local-content
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.webviewShowLocalData",
      () => {
        const panel = vscode.window.createWebviewPanel(
          "vscode-extension",
          "Webview Show Local Data",
          vscode.ViewColumn.One,
          {
            enableScripts: true, // enable scripts in the webview
            // Webview scripts can do just about anything that a script on a normal webpage can.
            // Keep in mind though that webviews exist in their own context, so scripts in a
            // webview do not have access to the VS Code API. That's where message passing comes in:
            // https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
            // only allow the webview to access resources in our extension's media directory
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, "src/media")),
              // trying to get from another folder will result on:
              // Failed to load resource: the server responded with a status of 404 ()
            ],
            // disallow all local resources:
            // localResourceRoots: [],
          }
        );
        // get path to resource on disk
        const onDiskPath = vscode.Uri.file(
          path.join(context.extensionPath, "src/media", "coding-cat.gif")
        );
        // and get the special URI to use with the webview
        const codingCatGifSrc = panel.webview.asWebviewUri(onDiskPath);
        panel.webview.html = getWebviewContentLocalData(codingCatGifSrc);
      }
    )
  );

  // passing messages from an extension to a webview with webview.postMessage()
  // receiving message on webviewHTML.ts, window.addEventListener('message'...)
  // https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-an-extension-to-a-webview
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.extensionToWebviewPrepare",
      () => {
        if (currentPanel) {
          currentPanel.reveal(vscode.ViewColumn.One);
        } else {
          currentPanel = vscode.window.createWebviewPanel(
            "vscode-extension", // identifies the type of the webview. Used internally
            "Extension to Webview Prepare", // title of the panel displayed to the user
            vscode.ViewColumn.One,
            {
              enableScripts: true,
            }
          );
          currentPanel.webview.html = getWebviewContent("Coding Cat");

          currentPanel.onDidDispose(
            () => {
              currentPanel = undefined;
            },
            undefined,
            context.subscriptions
          );
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-extension.extensionToWebviewExecute",
      () => {
        if (!currentPanel) {
          return;
        }
        // sending message (any JSON serializable data) to the webview with webview.postMessage()
        currentPanel.webview.postMessage({
          message: "Hello from extension.ts! Restarting code!",
          command: "restartCoding",
        });
        // being used / received on the file webviewHTML.ts at:
        // window.addEventListener('message', event => {
        // const message = event.data.message;
        // const command = event.data.command;
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
