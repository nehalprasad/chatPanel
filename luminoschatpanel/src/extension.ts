import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('luminoschatpanel.openPanel', () => {
      const panel = vscode.window.createWebviewPanel(
        'luminoschatpanelWebview',
        'Luminos Chat Panel',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
      );

      const indexPath = path.join(context.extensionPath, 'media', 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');

      // Fix resource paths for VS Code webview
      html = html.replace(/(src|href)="(.+?)"/g, (match, p1, p2) => {
        const resourcePath = panel.webview.asWebviewUri(
          vscode.Uri.file(path.join(context.extensionPath, 'media', p2))
        );
        return `${p1}="${resourcePath}"`;
      });

      panel.webview.html = html;
    })
  );
}

export function deactivate() {}