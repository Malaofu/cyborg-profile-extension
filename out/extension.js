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
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const hoverProvider_1 = require("./hoverProvider");
const completionProvider_1 = require("./completionProvider");
const decorationProvider_1 = require("./decorationProvider");
let decorationType;
function activate(context) {
    // Register Hover Provider
    const hoverProvider = vscode.languages.registerHoverProvider('cyborg-profile', new hoverProvider_1.HoverProvider());
    context.subscriptions.push(hoverProvider);
    // Register Completion Provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('cyborg-profile', new completionProvider_1.CompletionProvider(), '=');
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
            (0, decorationProvider_1.updateDecorations)(vscode.window.activeTextEditor, decorationType);
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
    vscode.languages.registerFoldingRangeProvider('cyborg-profile-blasts', {
        provideFoldingRanges(document) {
            const ranges = [];
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
                        var foldingRange = new vscode.FoldingRange(blastStartLine + 1, // Start after blast declaration
                        i - 1, // End before closing bracket
                        vscode.FoldingRangeKind.Region);
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
