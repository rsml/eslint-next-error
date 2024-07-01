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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('eslint-next-error.jumpToNextError', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showInformationMessage('No workspace folder is open.');
            return;
        }
        const allProblems = [];
        for (const folder of workspaceFolders) {
            const diagnostics = await vscode.languages.getDiagnostics(folder.uri);
            for (const diagnostic of diagnostics) {
                if (diagnostic.source === 'eslint') {
                    allProblems.push({ uri: folder.uri, diagnostic });
                }
            }
        }
        const eslintProblems = allProblems.sort((a, b) => a.uri.fsPath.localeCompare(b.uri.fsPath) ||
            a.diagnostic.range.start.line - b.diagnostic.range.start.line ||
            a.diagnostic.range.start.character - b.diagnostic.range.start.character);
        if (eslintProblems.length === 0) {
            vscode.window.showInformationMessage('No ESLint errors found in the workspace.');
            return;
        }
        const currentDocument = vscode.window.activeTextEditor?.document;
        const currentPosition = vscode.window.activeTextEditor?.selection.active;
        let nextProblemIndex = 0;
        if (currentDocument && currentPosition) {
            nextProblemIndex = eslintProblems.findIndex(problem => problem.uri.fsPath === currentDocument.uri.fsPath &&
                (problem.diagnostic.range.start.line > currentPosition.line ||
                    (problem.diagnostic.range.start.line === currentPosition.line &&
                        problem.diagnostic.range.start.character > currentPosition.character)));
            if (nextProblemIndex === -1) {
                nextProblemIndex = eslintProblems.findIndex(problem => problem.uri.fsPath > currentDocument.uri.fsPath);
            }
        }
        if (nextProblemIndex === -1) {
            nextProblemIndex = 0;
        }
        const nextProblem = eslintProblems[nextProblemIndex];
        const document = await vscode.workspace.openTextDocument(nextProblem.uri);
        const editor = await vscode.window.showTextDocument(document);
        editor.selection = new vscode.Selection(nextProblem.diagnostic.range.start, nextProblem.diagnostic.range.end);
        editor.revealRange(nextProblem.diagnostic.range, vscode.TextEditorRevealType.InCenter);
        vscode.window.showInformationMessage(`ESLint error: ${nextProblem.diagnostic.message}`);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map