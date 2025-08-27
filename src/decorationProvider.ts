import * as vscode from 'vscode';
import { hidUsageMap, hidPageMap, hidValueMap, buttonMap, axisMap } from './valueMaps'; // Import your maps

export function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
    const document = editor.document;
    const text = document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    // Regular expression to match attribute=0x... patterns
    const regex = /(\w+)=0x([0-9a-fA-F]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        const attribute = match[1];
        const hexCode = `0x${match[2]}`;

        let readableText = '';
        if (attribute === 'usage') {
            readableText = hidUsageMap[hexCode] || 'Unknown usage code';
        } else if (attribute === 'button' || attribute === 'buttonhid') {
            readableText = buttonMap[hexCode] || 'Unknown button code';
        } else if (attribute === 'mouseaxis') {
            readableText = axisMap[hexCode] || 'Unknown axis code'; 
        }

        if (readableText) {
            const startPos = document.positionAt(match.index + match[0].length);
            const decoration = {
                range: new vscode.Range(startPos, startPos),
                renderOptions: {
                    after: {
                        contentText: `(${readableText})\t`,
                    }
                }
            };
            decorations.push(decoration);
        }
    }

    editor.setDecorations(decorationType, decorations);
}
