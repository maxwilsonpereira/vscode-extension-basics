import { Uri } from "vscode";
import { cats } from "./cats";

export function getWebviewContent(cat: string) {
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
      </head>
      <body>
        <h1 class="title">Webview API</h1>
        <h1 id="message-received"></h1>
        <img src="${cats[cat]}" width="300" />
        <h1 id="lines-of-code-counter-a">0</h1>
        <script>
          const counter = document.getElementById('lines-of-code-counter-a');
          let count = 0;
          setInterval(() => {
              counter.textContent = count++;
          }, 200);
    
          // ***** EXTENSION TO WEBVIEW *****
          const messageReceived = document.getElementById('message-received');
          window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
              case 'restartCoding':
                messageReceived.textContent = event.data.message;
                count = 0;
                counter.textContent = count;
                break;
              }
          });

          // ***** WEBVIEW TO EXTENSION *****
          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'alert',
            text: '🐛  on line ' + count
          })

        </script>
      </body>
    </html>`;
}

export function getWebviewContentLocalData(cat: Uri) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
        <h1 class="title">Webview API</h1>
        <img src="${cat}" width="300" />
        <h1 id="lines-of-code-counter-b">0</h1>
        <script>
        const counter = document.getElementById('lines-of-code-counter-b');
        let count = 0;
        setInterval(() => {
            counter.textContent = count++;
        }, 200);
        </script>
    </body>
    </html>`;
}
