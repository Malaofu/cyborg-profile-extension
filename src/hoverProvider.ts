import * as vscode from 'vscode';
import { axisMap, buttonMap, hidPageMap, hidUsageMap, hidValueMap } from './valueMaps';

export class HoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        if (!range || !word || !/^0x[0-9a-fA-F]+$/.test(word)) {
            return null;
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
                if (attrName === 'button' || attrName === 'buttonhid') {
                    return new vscode.Hover(buttonMap[word] || 'Unknown button code');
                }
                if (attrName === 'mouseaxis') {
                    return new vscode.Hover(axisMap[word] || 'Unknown axis code');
                }
            }
        }

        return null;
    }
}

