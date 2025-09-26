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

    vscode.languages.registerFoldingRangeProvider('cyborg-profile', {
    provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const lines = document.getText().split(/\r?\n/);
        let inBlastSection = false;
        let blastStartLine = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for blast start
            if (line.includes('[blast=')) {
                inBlastSection = true;
                blastStartLine = i;
            }

            // Check for blast end
            if (inBlastSection && (line === '>')) {
                if (blastStartLine !== -1 && i > blastStartLine + 1) {
                    var foldingRange = new vscode.FoldingRange(
                        blastStartLine + 1, // Start after blast declaration
                        i - 1,              // End before closing bracket
                        vscode.FoldingRangeKind.Region
                    )
                    ranges.push(foldingRange);
                }
                inBlastSection = false;
                blastStartLine = -1;
            }
        }

        return ranges;
    }
});
}
