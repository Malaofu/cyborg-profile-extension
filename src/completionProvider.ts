import * as vscode from 'vscode';
import { controllerButtonMaps, hidPageMap, hidUsageMap, hidValueMap } from './valueMaps';

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
        function addCompletionItemsForTarget(target: string, map: Record<string, string>) {
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
        addCompletionItemsForTarget('usage', hidUsageMap);
        addCompletionItemsForTarget('page', hidPageMap);
        addCompletionItemsForTarget('value', hidValueMap);

        return items;
    }
}
