import * as vscode from 'vscode';
import { controllerButtonMaps, hidPageMap, hidUsageMap, hidValueMap } from './valueMaps';

function numToHex(num: number | string): string {
    const n = typeof num === 'string' ? parseInt(num, 10) : num;
    return '0x' + n.toString(16).padStart(8, '0').toUpperCase();
}

export class CompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position.line).text;
        const items: vscode.CompletionItem[] = [];

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

        const buttonMap = currentController && controllerButtonMaps[currentController]
            ? controllerButtonMaps[currentController]
            : {};

        // Helper function to add completion items
        function addCompletionItemsForTarget(target: string, map: Record<number | string, string>) {
            const prefix = `${target}=`;
            if (lineText.includes(prefix)) {
                Object.entries(map).forEach(([code, description]) => {
                    const hexCode = numToHex(code);
                    const item = new vscode.CompletionItem(hexCode);
                    item.detail = description;
                    item.filterText = description + ' ' + hexCode;
                    item.insertText = hexCode;
                    items.push(item);
                });
            }
        }

        addCompletionItemsForTarget('button', buttonMap);
        addCompletionItemsForTarget('buttonhid', buttonMap);
        addCompletionItemsForTarget('mouseaxis', buttonMap);
        addCompletionItemsForTarget('usage', hidUsageMap);
        addCompletionItemsForTarget('page', hidPageMap);
        addCompletionItemsForTarget('value', hidValueMap);

        return items;
    }
}
