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
            const predefinedTags = config.defaultTags || getDefaultConfig().defaultTags;
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

    const disposableUndo = vscode.commands.registerCommand('warpwrap.undoWrap', async () => {
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

    const disposableOpenUI = vscode.commands.registerCommand('warpwrap.openUI', () => {
        const panel = vscode.window.createWebviewPanel(
            'warpwrapUI',
            'WarpWrap UI',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposableWrap, disposableUndo, disposableOpenUI);
}

export function deactivate() {}

function loadConfig(): any {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return getDefaultConfig();

    const configPath = path.join(workspaceFolders[0].uri.fsPath, 'warpwrap.json');

    if (!fs.existsSync(configPath)) {
        // If file doesn't exist, create it with default settings
        fs.writeFileSync(configPath, JSON.stringify(getDefaultConfig(), null, 2));
        vscode.window.showInformationMessage("warpwrap.json created with default settings.");
    }

    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        vscode.window.showErrorMessage("Error parsing warpwrap.json. Using default settings.");
        return getDefaultConfig();
    }
}

function getDefaultConfig(): any {
    return {
        defaultTags: [
            "div", "span", "section", "article", "header", "footer",
            "nav", "aside", "p", "strong", "em", "blockquote", "code",
            "table", "tr", "td", "ul", "ol", "li", "a", "custom"
        ],
        autoFormat: true,
        jsxSupport: true,
        bulkWrap: true,
        useLastTag: false,
        customTemplate: "<{tag}{attributes}>{content}</{tag}>"
    };
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

function wrapSelection(textEditor: vscode.TextEditor, selection: vscode.Selection, tag: string, attributes: string): string {
    const selectedText = textEditor.document.getText(selection);
        const indentation = getIndentation(textEditor, selection);
    
    function getIndentation(textEditor: vscode.TextEditor, selection: vscode.Selection): string {
        const line = textEditor.document.lineAt(selection.start.line);
        return line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
    }
    return `${indentation}<${tag}${attributes}>
${indentation}    ${selectedText.trim()}
${indentation}</${tag}>`;
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
            <title>WarpWrap UI</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    padding: 20px;
                    background-color: #1e1e1e;
                    color: #ccc;
                    text-align: center;
                }
                h2 {
                    color: #fff;
                }
                .container {
                    max-width: 400px;
                    margin: auto;
                    padding: 20px;
                    background: #252526;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.1);
                }
                label {
                    font-size: 14px;
                    display: block;
                    margin-top: 10px;
                }
                select, input, button {
                    width: 100%;
                    padding: 8px;
                    font-size: 14px;
                    background: #333;
                    color: #fff;
                    border: 1px solid #555;
                    border-radius: 5px;
                    margin-top: 5px;
                }
                button {
                    background: #007acc;
                    cursor: pointer;
                    transition: 0.3s;
                    margin-top: 15px;
                }
                button:hover {
                    background: #005f99;
                }
                .preview {
                    margin-top: 15px;
                    padding: 10px;
                    background: #2d2d2d;
                    border-radius: 5px;
                    color: #fff;
                    font-size: 14px;
                    text-align: left;
                }
            </style>
        </head>
        <body>
            <h2>WarpWrap - HTML Wrapper</h2>
            <div class="container">
                <label for="tag">Select a Tag:</label>
                <select id="tag">
                    <option value="div">div</option>
                    <option value="span">span</option>
                    <option value="section">section</option>
                    <option value="article">article</option>
                    <option value="header">header</option>
                    <option value="footer">footer</option>
                    <option value="nav">nav</option>
                    <option value="aside">aside</option>
                    <option value="p">p</option>
                    <option value="strong">strong</option>
                    <option value="custom">Custom</option>
                </select>
                
                <label for="class">Class Name (optional):</label>
                <input type="text" id="class" placeholder="e.g. my-class">

                <label for="id">ID (optional):</label>
                <input type="text" id="id" placeholder="e.g. my-id">

                <label for="styles">Inline Styles (optional):</label>
                <input type="text" id="styles" placeholder="e.g. color: red; font-size: 14px;">

                <button onclick="wrapText()">Wrap Selection</button>

                <div id="preview" class="preview">Live Preview: &lt;div&gt;...&lt;/div&gt;</div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById("tag").addEventListener("change", updatePreview);
                document.getElementById("class").addEventListener("input", updatePreview);
                document.getElementById("id").addEventListener("input", updatePreview);
                document.getElementById("styles").addEventListener("input", updatePreview);

                function updatePreview() {
                    let tag = document.getElementById('tag').value;
                    let className = document.getElementById('class').value;
                    let idName = document.getElementById('id').value;
                    let styles = document.getElementById('styles').value;

                    let attributes = "";
                    if (className) attributes += " class=\\"" + className + "\\"";
                    if (idName) attributes += " id=\\"" + idName + "\\"";
                    if (styles) attributes += " style=\\"" + styles + "\\"";

                    document.getElementById('preview').innerHTML = "Live Preview: &lt;" + tag + attributes + "&gt;...&lt;/" + tag + "&gt;";
                }

                function wrapText() {
                    let tag = document.getElementById('tag').value;
                    let className = document.getElementById('class').value;
                    let idName = document.getElementById('id').value;
                    let styles = document.getElementById('styles').value;

                    if (tag === 'custom') {
                        tag = prompt('Enter a custom HTML tag:');
                        if (!tag) return;
                    }

                    vscode.postMessage({ command: 'wrapText', tag, className, idName, styles });
                }
            </script>
        </body>
        </html>
    `;
}
