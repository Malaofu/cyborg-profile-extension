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
exports.CompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const valueMaps_1 = require("./valueMaps");
class CompletionProvider {
    provideCompletionItems(document, position) {
        const lineText = document.lineAt(position.line).text;
        const items = [];
        // Find current controller by scanning upward from current line
        let currentController = null;
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const controllerMatch = line.match(/\[controller=([A-Fa-f0-9-]+)/);
            if (controllerMatch) {
                currentController = controllerMatch[1].toLowerCase();
                break; // First controller match is the current one
            }
        }
        const buttonMap = currentController && valueMaps_1.controllerButtonMaps[currentController]
            ? valueMaps_1.controllerButtonMaps[currentController]
            : {};
        // Helper function to add completion items
        function addCompletionItemsForTarget(target, map) {
            const prefix = `${target}=`;
            if (lineText.includes(prefix)) {
                Object.entries(map).forEach(([code, description]) => {
                    const item = new vscode.CompletionItem(code);
                    item.detail = description;
                    item.filterText = description + ' ' + code;
                    item.insertText = code;
                    items.push(item);
                });
            }
        }
        addCompletionItemsForTarget('button', buttonMap);
        addCompletionItemsForTarget('buttonhid', buttonMap);
        addCompletionItemsForTarget('mouseaxis', buttonMap);
        addCompletionItemsForTarget('usage', valueMaps_1.hidUsageMap);
        addCompletionItemsForTarget('page', valueMaps_1.hidPageMap);
        addCompletionItemsForTarget('value', valueMaps_1.hidValueMap);
        return items;
    }
}
exports.CompletionProvider = CompletionProvider;
