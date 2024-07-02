import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('eslint-next-error.jumpToNextError', async () => {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No workspace folder is open.');
            return;
        }

        const allProblems = [];
        // Retrieve diagnostics for all files that VS Code has processed
        const allDiagnostics = vscode.languages.getDiagnostics();
        for (const [uri, diagnostics] of allDiagnostics) {
            for (const diagnostic of diagnostics) {
                if (diagnostic.source === 'eslint') {
                    allProblems.push({ uri, diagnostic });
                }
            }
        }

        // Sort and find problems as in the previous version of your function
        const eslintProblems = allProblems.sort((a, b) =>
            a.uri.fsPath.localeCompare(b.uri.fsPath) ||
            a.diagnostic.range.start.line - b.diagnostic.range.start.line ||
            a.diagnostic.range.start.character - b.diagnostic.range.start.character
        );

        if (eslintProblems.length === 0) {
            vscode.window.showInformationMessage('No ESLint errors found in the open files.');
            return;
        }

        const currentDocument = vscode.window.activeTextEditor?.document;
        const currentPosition = vscode.window.activeTextEditor?.selection.active;

        let nextProblemIndex = 0;
        if (currentDocument && currentPosition) {
            nextProblemIndex = eslintProblems.findIndex(problem =>
                problem.uri.fsPath === currentDocument.uri.fsPath &&
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

        editor.selection = new vscode.Selection(
            nextProblem.diagnostic.range.start,
            nextProblem.diagnostic.range.end
        );
        editor.revealRange(nextProblem.diagnostic.range, vscode.TextEditorRevealType.InCenter);

        vscode.window.showInformationMessage(`ESLint error: ${nextProblem.diagnostic.message}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
