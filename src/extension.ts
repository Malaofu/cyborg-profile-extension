import * as vscode from 'vscode';
import { HoverProvider } from './hoverProvider';
import { CompletionProvider } from './completionProvider';
import { updateDecorations } from './decorationProvider';

let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    // Register Hover Provider
    const hoverProvider = vscode.languages.registerHoverProvider('cyborg-profile', new HoverProvider());
    context.subscriptions.push(hoverProvider);

    // Register Completion Provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'cyborg-profile',
        new CompletionProvider(),
        '='
    );
    context.subscriptions.push(completionProvider);

    // Create and configure the decoration type
    decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            color: new vscode.ThemeColor('editorCodeLens.foreground'),
            margin: '0 0 0 1em'
        }
    });

    // Function to update decorations whenever necessary
    function triggerUpdateDecorations() {
        if (vscode.window.activeTextEditor) {
            updateDecorations(vscode.window.activeTextEditor, decorationType);
        }
    }

    // Trigger an update whenever the active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // Trigger an update whenever the document text changes
    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    // Manually trigger decoration updates initially
    triggerUpdateDecorations();

    // Register command to manually trigger updates (Step 4)
    let updateDecorationsCommand = vscode.commands.registerCommand('extension.updateDecorations', () => {
        triggerUpdateDecorations();
    });

    context.subscriptions.push(updateDecorationsCommand);
}
