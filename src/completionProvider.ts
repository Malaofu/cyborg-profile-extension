import * as vscode from 'vscode';
import { buttonMap, hidPageMap, hidUsageMap, hidValueMap } from './valueMaps';

export class CompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position.line).text;
        const items: vscode.CompletionItem[] = [];

        // Helper function to add completion items for a given target and map
        function addCompletionItemsForTarget(target: string, map: Record<string, string>) {
            if (lineText.includes(`${target}=`)) {
            Object.entries(map).forEach(([code, description]) => {
                const item = new vscode.CompletionItem(code);
                item.detail = description;
                item.filterText = description;
                item.insertText = code;

                // Set the range to replace the current code for the target
                const start = lineText.indexOf(`${target}=`) + target.length + 1;
                let end = lineText.indexOf(' ', start);
                if (end === -1) end = lineText.length;
                item.range = new vscode.Range(position.line, start, position.line, end);

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

