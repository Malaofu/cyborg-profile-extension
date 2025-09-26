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
exports.HoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const valueMaps_1 = require("./valueMaps");
class HoverProvider {
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        // Handle attribute names
        if (word === 'usage') {
            return new vscode.Hover('`usage` defines the keyboard input (HID usage code).');
        }
        if (word === 'page') {
            return new vscode.Hover('`page` defines the HID usage page.');
        }
        if (word === 'value') {
            return new vscode.Hover('`value` indicates key state: `0x00000001` (pressed), `0x00000000` (released).');
        }
        if (word === 'button' || word === 'buttonhid' || word === 'mouseaxis') {
            return new vscode.Hover('Button or mouse axis code.');
        }
        // Only proceed for hex values
        if (!range || !word || !/^0x[0-9a-fA-F]+$/.test(word)) {
            return null;
        }
        // Find the current controller by scanning upward from current line
        let currentController = null;
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const controllerMatch = line.match(/\[controller=([a-f0-9-]+)/);
            if (controllerMatch) {
                currentController = controllerMatch[1];
                break; // First controller match is the current one
            }
        }
        const lineText = document.lineAt(position.line).text;
        const attributeMatch = lineText.match(/(\w+)=0x[0-9a-fA-F]+/g);
        if (!attributeMatch) {
            return null;
        }
        for (const attribute of attributeMatch) {
            const [attrName, attrValue] = attribute.split('=');
            if (attrValue === word) {
                if (attrName === 'usage') {
                    return new vscode.Hover(valueMaps_1.hidUsageMap[word] || 'Unknown usage code');
                }
                if (attrName === 'page') {
                    return new vscode.Hover(valueMaps_1.hidPageMap[word] || 'Unknown page code');
                }
                if (attrName === 'value') {
                    return new vscode.Hover(valueMaps_1.hidValueMap[word] || 'Unknown value code');
                }
                if (attrName === 'button' || attrName === 'buttonhid' || attrName === 'mouseaxis' || attrName === 'hat' || attrName === 'axis') {
                    // Use controller-specific mapping if available
                    if (currentController && valueMaps_1.controllerButtonMaps[currentController]) {
                        return new vscode.Hover(valueMaps_1.controllerButtonMaps[currentController][word] || 'Unknown button code for this controller');
                    }
                    return new vscode.Hover('Unknown button code (no controller context)');
                }
            }
        }
        return null;
    }
}
exports.HoverProvider = HoverProvider;
