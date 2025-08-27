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
const valueMaps_1 = require("./valueMaps"); // Import your maps
function updateDecorations(editor, decorationType) {
    const document = editor.document;
    const text = document.getText();
    const decorations = [];
    // Regular expression to match attribute=0x... patterns
    const regex = /(\w+)=0x([0-9a-fA-F]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const attribute = match[1];
        const hexCode = `0x${match[2]}`;
        let readableText = '';
        if (attribute === 'usage') {
            readableText = valueMaps_1.hidUsageMap[hexCode] || 'Unknown usage code';
        }
        else if (attribute === 'button' || attribute === 'buttonhid') {
            readableText = valueMaps_1.buttonMap[hexCode] || 'Unknown button code';
        }
        else if (attribute === 'mouseaxis') {
            readableText = valueMaps_1.axisMap[hexCode] || 'Unknown axis code';
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
