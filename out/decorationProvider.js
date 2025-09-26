"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDecorations = updateDecorations;
const vscode = __importStar(require("vscode"));
const valueMaps_1 = require("./valueMaps");
function updateDecorations(editor, decorationType) {
    const document = editor.document;
    const text = document.getText();
    const decorations = [];
    // Track controller scopes line by line
    let currentController = null;
    const lines = text.split(/\r?\n/);
    // Blast section tracking
    const blastMap = {};
    let currentBlastId = '';
    let currentBlastContent = '';
    let inBlastSection = false;
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
                readableText = valueMaps_1.hidUsageMap[hexCode] || 'Unknown usage code';
            }
            else if (attribute === 'value') {
                readableText = valueMaps_1.hidValueMap[hexCode] || 'Unknown value code';
            }
            else if (attribute === 'button' || attribute === 'buttonhid' || attribute === 'mouseaxis' || attribute === 'hat' || attribute === 'axis') {
                if (currentController && valueMaps_1.controllerButtonMaps[currentController]) {
                    readableText = valueMaps_1.controllerButtonMaps[currentController][hexCode] || 'Unknown button code';
                }
                else {
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
