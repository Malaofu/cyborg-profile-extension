import * as vscode from 'vscode';
import { controllerButtonMaps, hidPageMap, hidUsageMap, hidValueMap } from './valueMaps';

export class HoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
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
            const controllerMatch = line.match(/\[controller=([A-Fa-f0-9-]+)/);
            if (controllerMatch) {
                currentController = controllerMatch[1].toLowerCase();
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
                    return new vscode.Hover(hidUsageMap[word] || 'Unknown usage code');
                }
                if (attrName === 'page') {
                    return new vscode.Hover(hidPageMap[word] || 'Unknown page code');
                }
                if (attrName === 'value') {
                    return new vscode.Hover(hidValueMap[word] || 'Unknown value code');
                }
                if (attrName === 'button' || attrName === 'buttonhid' || attrName === 'mouseaxis' || attrName === 'hat' || attrName === 'axis') {
                    // Use controller-specific mapping if available
                    if (currentController && controllerButtonMaps[currentController]) {
                        return new vscode.Hover(controllerButtonMaps[currentController][word] || 'Unknown button code for this controller');
                    }
                    return new vscode.Hover('Unknown button code (no controller context)');
                }
            }
        }

        return null;
    }
}
