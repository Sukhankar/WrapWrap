import * as assert from 'assert';
import * as vscode from 'vscode';

suite('WarpWrap Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting tests...');

    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('your-username.warpwrap');
        assert.ok(extension);
    });

    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('your-username.warpwrap');
        await extension?.activate();
        assert.ok(extension?.isActive);
    });

    test('Wrap command should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('html-wrapper.wrapSelection'));
    });

    test('Wrap function should modify text', async () => {
        const editor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ content: 'Hello World' }));
        await vscode.commands.executeCommand('html-wrapper.wrapSelection');
        
        const newText = editor.document.getText();
        assert.notStrictEqual(newText, 'Hello World', 'Text should be wrapped with a tag');
    });
});
