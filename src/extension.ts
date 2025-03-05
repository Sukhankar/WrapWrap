import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let lastWrap: { selections: vscode.Selection[], wrappedTexts: string[] } | null = null;
let lastTag = '', lastClass = '', lastId = '';

export function activate(context: vscode.ExtensionContext) {
    console.log('"WarpWrap" is now active!');

    const disposableWrap = vscode.commands.registerTextEditorCommand('warpwrap.wrapSelection', async (textEditor, edit) => {
        try {
            const config = loadConfig();
            const predefinedTags = config.defaultTags || ['div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'aside', 'custom'];
            const autoFormat = config.autoFormat ?? true;
            const jsxSupport = config.jsxSupport ?? true;

            let tag = await getTagSelection(predefinedTags);
            if (!tag) return;

            let { className, idName, inlineStyles } = await getAttributes(textEditor);

            const selections = textEditor.selections;
            if (selections.every(sel => sel.isEmpty)) {
                return vscode.window.showInformationMessage('No text selected!');
            }

            lastTag = tag; lastClass = className; lastId = idName;
            
            const attributes = formatAttributes({ className, idName, inlineStyles }, jsxSupport);
            const wrappedTexts = selections.map(selection => {
                const existingTag = detectExistingWrapper(textEditor, selection);
                return existingTag ? updateExistingWrapper(textEditor, selection, existingTag, attributes) : wrapSelection(textEditor, selection, tag, attributes);
            });

            lastWrap = { selections: [...selections], wrappedTexts };

            await textEditor.edit(editBuilder => {
                selections.forEach((selection, i) => {
                    editBuilder.replace(selection, wrappedTexts[i]);
                });
            });

            if (autoFormat) await vscode.commands.executeCommand('editor.action.formatDocument');
            vscode.window.showInformationMessage(`Wrapped selection(s) with <${tag}> successfully!`);
        } catch (error) {
            console.error('Error in WarpWrap:', error);
            vscode.window.showErrorMessage('An error occurred while wrapping selection. Check console for details.');
        }
    });

    const disposableUndo = vscode.commands.registerCommand('warpwrap.undoLastWrap', async () => {
        if (!lastWrap) return vscode.window.showWarningMessage('No previous wrap action to undo.');
        const textEditor = vscode.window.activeTextEditor;
        if (!textEditor) return;

        await textEditor.edit(editBuilder => {
            lastWrap!.selections.forEach((selection, i) => {
                editBuilder.replace(selection, lastWrap!.wrappedTexts[i]);
            });
        });

        lastWrap = null;
        vscode.window.showInformationMessage('Last wrap action undone.');
    });

    const disposableUI = vscode.commands.registerCommand('warpwrap.openUI', () => {
           const panel = vscode.window.createWebviewPanel(
               'warpwrapUI',
               'WarpWrap - HTML Wrapper',
               vscode.ViewColumn.Two,
               { enableScripts: true }
           );
   
           panel.webview.html = getWebviewContent();
   
           panel.webview.onDidReceiveMessage(
               message => {
                   if (message.command === 'wrapText') {
                       wrapSelectionWithUI(message.tag, message.className, message.idName);
                   }
               },
               undefined,
               context.subscriptions
           );
       });
   
       context.subscriptions.push(disposableWrap, disposableUndo, disposableUI);
   }

export function deactivate() {}

function loadConfig(): any {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return {};
    
    const configPath = path.join(workspaceFolders[0].uri.fsPath, 'warpwrap.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (err) {
            vscode.window.showErrorMessage('Error parsing warpwrap.json');
            return {};
        }
    }
    return {};
}

async function getTagSelection(predefinedTags: string[]): Promise<string | undefined> {
    return await vscode.window.showQuickPick(predefinedTags, { placeHolder: 'Select a tag to wrap your selection' }) || '';
}

async function getAttributes(textEditor: vscode.TextEditor) {
    const existingAttributes = getExistingAttributes(textEditor);

    const className = await vscode.window.showInputBox({
        prompt: 'Enter class name (optional)',
        placeHolder: 'e.g. my-class',
        value: existingAttributes.className || lastClass
    }) || '';

    const idName = await vscode.window.showInputBox({
        prompt: 'Enter ID (optional)',
        placeHolder: 'e.g. my-id',
        value: existingAttributes.idName || lastId
    }) || '';

    const inlineStyles = await vscode.window.showInputBox({
        prompt: 'Enter inline styles (optional)',
        placeHolder: 'e.g. color: red; font-size: 14px;',
        value: existingAttributes.inlineStyles || ''
    }) || '';

    return { className, idName, inlineStyles };
}

function formatAttributes({ className, idName, inlineStyles }: any, jsxSupport: boolean): string {
    let attributes = [];
    if (className) attributes.push(`${jsxSupport ? 'className' : 'class'}="${className}"`);
    if (idName) attributes.push(`id="${idName}"`);
    if (inlineStyles) attributes.push(`style="${inlineStyles}"`);
    return attributes.length ? ' ' + attributes.join(' ') : '';
}
function getIndentation(textEditor: vscode.TextEditor, selection: vscode.Selection): string {
    const lineText = textEditor.document.lineAt(selection.start.line).text;
    return lineText.match(/^\s*/)?.[0] || "";
}

function wrapSelection(textEditor: vscode.TextEditor, selection: vscode.Selection, tag: string, attributes: string): string {
    const selectedText = textEditor.document.getText(selection);
    const indentation = getIndentation(textEditor, selection);
    return `${indentation}<${tag}${attributes}>
${indentation}    ${selectedText.trim()}
${indentation}</${tag}>`;
}
function wrapSelectionWithUI(tag: string, className: string, idName: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const { document, selection } = editor;
    const selectedText = document.getText(selection);
    const attributes = [
        className ? ` class="${className}"` : '',
        idName ? ` id="${idName}"` : ''
    ].join('');

    const wrappedText = `<${tag}${attributes}>${selectedText}</${tag}>`;

    editor.edit(editBuilder => {
        editBuilder.replace(selection, wrappedText);
    });

    vscode.window.showInformationMessage(`Wrapped selection(s) with <${tag}> successfully!`);
}
function detectExistingWrapper(textEditor: vscode.TextEditor, selection: vscode.Selection): string | null {
    const selectedText = textEditor.document.getText(selection);
    const match = selectedText.match(/^<([a-zA-Z0-9-]+)(.*?)>([\s\S]*)<\/\1>$/);
    return match ? match[1] : null;
}

function updateExistingWrapper(textEditor: vscode.TextEditor, selection: vscode.Selection, existingTag: string, attributes: string): string {
    const selectedText = textEditor.document.getText(selection);
    return selectedText.replace(/^<([a-zA-Z0-9-]+)(.*?)>([\s\S]*)<\/\1>$/, `<${existingTag}${attributes}>$3</${existingTag}>`);
}

function getExistingAttributes(textEditor: vscode.TextEditor) {
    const selection = textEditor.selection;
    let className = '', idName = '', inlineStyles = '';

    for (let i = Math.max(0, selection.start.line - 5); i <= selection.start.line; i++) {
        const lineText = textEditor.document.lineAt(i).text;
        if (!className) {
            const match = lineText.match(/class=["']([^"']+)["']/);
            className = match ? match[1] : '';
        }
        if (!idName) {
            const match = lineText.match(/id=["']([^"']+)["']/);
            idName = match ? match[1] : '';
        }
        if (!inlineStyles) {
            const match = lineText.match(/style=["']([^"']+)["']/);
            inlineStyles = match ? match[1] : '';
        }
        if (className && idName && inlineStyles) break;
    }
    return { className, idName, inlineStyles };
}
function getWebviewContent() {
    return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WarpWrap - HTML Wrapper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #1e1e1e;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 400px;
            margin: auto;
            background: #2e2e2e;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }
        h2 {
            margin-bottom: 20px;
            color: #f5a623;
        }
        select, input, button {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: none;
            font-size: 16px;
        }
        select {
            background: #3e3e3e;
            color: white;
        }
        input {
            background: #333;
            color: white;
            border: 1px solid #555;
        }
        button {
            background: #0078d4;
            color: white;
            cursor: pointer;
            font-weight: bold;
        }
        button:hover {
            background: #005ea6;
        }
        .preview {
            margin-top: 20px;
            padding: 10px;
            background: #222;
            border-radius: 5px;
            font-size: 14px;
            color: #bbb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>WarpWrap - HTML Wrapper</h2>
        <select id="tagSelector">
            <option value="div">div</option>
            <option value="span">span</option>
            <option value="section">section</option>
            <option value="article">article</option>
            <option value="aside">aside</option>
            <option value="header">header</option>
            <option value="footer">footer</option>
        </select>
        <input type="text" id="className" placeholder="Enter class name (optional)">
        <input type="text" id="idName" placeholder="Enter ID (optional)">
        <button onclick="wrapSelection()">Wrap Selection</button>
        <div class="preview" id="preview"></div>
    </div>
<script>
    const tagSelector = document.getElementById('tagSelector');
    const className = document.getElementById('className');
    const idName = document.getElementById('idName');
    const preview = document.getElementById('preview');
    if (tagSelector) tagSelector.addEventListener('change', updatePreview);
    if (className) className.addEventListener('input', updatePreview);
    if (idName) idName.addEventListener('input', updatePreview);
    showPreview();
    function updatePreview() {
        preview.innerText = \`<\${tagSelector.value}\${getAttributes()}>Your selected text</\${tagSelector.value}>\`;
    }
    function getAttributes() {
        const classNameValue = className.value ? \` class="\${className.value}"\` : '';
        const idNameValue = idName.value ? \` id="\${idName.value}"\` : '';
        return classNameValue + idNameValue;
    }
    function wrapSelection() {
        const tag = tagSelector.value;
        const classNameValue = className.value;
        const idNameValue = idName.value;
        vscode.postMessage({
            command: 'wrapText',
            tag,
            className: classNameValue,
            idName: idNameValue
        });
    }
    function showPreview() {
        updatePreview();
    }
</script>
</body>
</html>

    `;
}