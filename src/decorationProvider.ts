import * as vscode from 'vscode';
import { hidUsageMap, hidPageMap, hidValueMap, controllerButtonMaps } from './valueMaps';

export function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
    const document = editor.document;
    const text = document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    // Track controller scopes line by line
    let currentController = null;
    const lines = text.split(/\r?\n/);

    // First pass: set controller context
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Set new controller when we see a controller line
        const controllerMatch = line.match(/\[controller=([a-f0-9-]+)/);
        if (controllerMatch) {
            currentController = controllerMatch[1];
        }

        // Process all matches on this line with current controller context
        const lineRegex = /(\w+)=0x([0-9a-fA-F]+)/g;
        let match;

        while ((match = lineRegex.exec(line)) !== null) {
            const attribute = match[1];
            const hexCode = `0x${match[2]}`;
            let readableText = '';

            if (attribute === 'usage') {
                readableText = hidUsageMap[hexCode] || 'Unknown usage code';
            } else if (attribute === 'value') {
                readableText = hidValueMap[hexCode] || 'Unknown value code';
            } else if (attribute === 'button' || attribute === 'buttonhid' || attribute === 'mouseaxis' || attribute === 'hat' || attribute === 'axis') {
                if (currentController && controllerButtonMaps[currentController]) {
                    readableText = controllerButtonMaps[currentController][hexCode] || 'Unknown button code';
                } else {
                    readableText = 'Unknown button code';
                }
            }

            if (readableText) {
                const lineStart = document.positionAt(document.offsetAt(new vscode.Position(i, 0)) + match.index + match[0].length);
                decorations.push({
                    range: new vscode.Range(lineStart, lineStart),
                    renderOptions: {
                        after: {
                            contentText: ` (${readableText})`,
                        }
                    }
                });
            }
        }
    }

    editor.setDecorations(decorationType, decorations);
}
