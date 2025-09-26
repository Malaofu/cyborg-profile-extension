import * as vscode from 'vscode';
import { hidUsageMap, hidPageMap, hidValueMap, controllerButtonMaps } from './valueMaps';

export function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
    const document = editor.document;
    const text = document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    // Track controller scopes line by line
    let currentController = null;
    const lines = text.split(/\r?\n/);

    // Blast section tracking
    const blastMap: Record<string, string> = {};
    let currentBlastId = '';
    let currentBlastContent = '';
    let inBlastSection = false;

    // First pass: set controller context
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Set new controller when we see a controller line
        const controllerMatch = line.match(/\[controller=([A-Fa-f0-9-]+)/);
        if (controllerMatch) {
            currentController = controllerMatch[1].toLowerCase();
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

    // Second pass: collect all blast images
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for blast start
        if (line.startsWith('[blast=')) {
            const blastMatch = line.match(/\[blast=([a-f0-9-]+)/);
            if (blastMatch) {
                currentBlastId = blastMatch[1];
                inBlastSection = true;
                currentBlastContent = '';
            }
        }

        // Collect base64 lines
        if (inBlastSection && /^[A-Za-z0-9+/=]+$/.test(line)) {
            currentBlastContent += line.trim();
        }

        // Check for blast end
        if (inBlastSection && (line === '>')) {
            if (currentBlastId && currentBlastContent) {
                blastMap[currentBlastId] = currentBlastContent;
            }
            inBlastSection = false;
            currentBlastId = '';
            currentBlastContent = '';
        }
    }

    // Third pass: add blast decorations
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Add hover to blast GUIDs in blast sections
        const blastMatch = line.match(/\[blast=([a-f0-9-]+)/);
        if (blastMatch && blastMatch.index !== undefined) {
            const blastId = blastMatch[1];
            currentBlastId = blastId;
            if (blastMap[blastId]) {
                const imageSrc = `data:image/jpeg;base64,${blastMap[blastId]}`;
                const hoverMessage = new vscode.MarkdownString(`**Blast Image (${blastId})**\n\n![Image Preview](${imageSrc})`);
                hoverMessage.isTrusted = true;

                const startPos = document.positionAt(document.offsetAt(new vscode.Position(i, blastMatch.index)));
                const endPos = document.positionAt(document.offsetAt(new vscode.Position(i, blastMatch.index + blastMatch[0].length)));

                decorations.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: hoverMessage
                });
            }
        }

        // Add hover to icon references
        const iconMatch = line.match(/icon=([a-f0-9-]+)/);
        if (iconMatch && iconMatch.index) {
            const blastId = iconMatch[1];
            if (blastMap[blastId]) {
                const imageSrc = `data:image/jpeg;base64,${blastMap[blastId]}`;
                const hoverMessage = new vscode.MarkdownString(`**Blast Image (${blastId})**\n\n![Image Preview](${imageSrc})`);
                hoverMessage.isTrusted = true;

                const startPos = document.positionAt(document.offsetAt(new vscode.Position(i, iconMatch.index)));
                const endPos = document.positionAt(document.offsetAt(new vscode.Position(i, iconMatch.index + iconMatch[0].length)));

                decorations.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: hoverMessage
                });
            }
        }

        // Add hover to data< lines
        const dataMatch = line.match(/data<(\d+)/);
        if (dataMatch && dataMatch.index !== undefined) {
            const blastId = currentBlastId;
            if (blastId && blastMap[blastId]) {
                const imageSrc = `data:image/jpeg;base64,${blastMap[blastId]}`;
                const hoverMessage = new vscode.MarkdownString(`**Blast Image (${blastId})**\n\n![Image Preview](${imageSrc})`);
                hoverMessage.isTrusted = true;

                const startPos = document.positionAt(document.offsetAt(new vscode.Position(i, dataMatch.index)));
                const endPos = document.positionAt(document.offsetAt(new vscode.Position(i, dataMatch.index + dataMatch[0].length)));

                decorations.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: hoverMessage
                });
            }
        }

        // Add hover to base64 lines (your existing code)
        if (/^[A-Za-z0-9+/=]+$/.test(line.trim()) && currentBlastId && blastMap[currentBlastId]) {
            const imageSrc = `data:image/jpeg;base64,${blastMap[currentBlastId]}`;
            const hoverMessage = new vscode.MarkdownString(`**Blast Image (${currentBlastId})**\n\n![Image Preview](${imageSrc})`);
            hoverMessage.isTrusted = true;

            const startPos = document.positionAt(document.offsetAt(new vscode.Position(i, 0)));
            const endPos = document.positionAt(document.offsetAt(new vscode.Position(i, line.length)));

            decorations.push({
                range: new vscode.Range(startPos, endPos),
                hoverMessage: hoverMessage
            });
        }
    }

    editor.setDecorations(decorationType, decorations);
}
