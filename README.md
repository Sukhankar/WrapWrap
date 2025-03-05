Here's an updated **`README.md`** file for your **WarpWrap** VS Code extension, including detailed installation and usage instructions for **VS Code**. It ensures that users can easily understand how to install, activate, and use the extension efficiently. 🚀  

---

# 📌 WarpWrap - VS Code Extension
WarpWrap is a **VS Code extension** that helps developers quickly wrap selected **HTML code** with common **HTML elements** (`div`, `span`, `section`, etc.), while optionally adding `class` and `id` attributes.

This extension enhances **productivity** by providing a **Webview-based UI** that allows users to easily select their wrapping preferences.

---

## 🚀 Features
✅ Live Preview of Wrapped Content
✅ Wrap with Attributes from Configuration File (warpwrap.json)
✅ Smart HTML Context Detection
✅ HTML Attribute Suggestions & Autocomplete
✅ Multi-Level Nesting Support
✅ Convert Inline Styles to CSS Classes (CSS Extraction)
✅ Undo Last Wrap
✅ JSX/TSX Wrapping Support

---
🛠️ Advanced Features
🔹 Live Preview
WarpWrap provides a real-time preview of how your HTML structure will look before applying the changes.

🔹 warpwrap.json Configuration File
Define default attributes and wrapping behaviors in warpwrap.json:

json
Copy
Edit
{
  "defaultTag": "div",
  "defaultClass": "wrapper",
  "allowedTags": ["div", "span", "section", "article"],
  "convertInlineStyles": true
}
🔹 Smart HTML Context Detection
WarpWrap intelligently detects HTML structures and suggests the most relevant wrapping tags.

🔹 HTML Attribute Suggestions & Autocomplete
While wrapping, WarpWrap suggests common attributes (class, id, data-*, aria-*, etc.) based on your document.

🔹 Multi-Level Nesting Support
WarpWrap can wrap multiple nested selections at once, preserving structure.

🔹 Convert Inline Styles to CSS Classes (CSS Extraction)
If enabled, WarpWrap automatically extracts inline styles and converts them into CSS classes.

🔹 Undo Last Wrap
Easily revert your last wrapping action if needed.

🔹 JSX/TSX Wrapping Support
WarpWrap fully supports React JSX/TSX syntax, ensuring compatibility with modern frontend development.

---

## 📦 Installation

### **1️⃣ Install from VS Code Marketplace (Coming Soon)**
Once published, you can install it directly from the **VS Code Extension Marketplace**.

1. Open **VS Code**.
2. Go to **Extensions (`Ctrl+Shift+X`)**.
3. Search for **`WarpWrap`**.
4. Click **Install**.

---

### **2️⃣ Manual Installation (For Development)**
To install this extension manually:

1. Clone the repository:
   ```sh
   git clone https://github.com/Sukhankar/WrapWrap
   cd warpwrap
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Compile the extension:
   ```sh
   npm run compile
   ```
4. Open the project in **VS Code** and **Press `F5`** to launch the extension.

---

## 🎯 How to Use WarpWrap in VS Code

### **Method 1: Using the Command Palette**
1. **Open an HTML file** in VS Code.
2. **Select the code** you want to wrap.
3. **Open the Command Palette** (`Ctrl+Shift+P`).
4. Search for **"WarpWrap: Wrap with Tag"** and **press `Enter`**.
5. A **UI panel** will appear, allowing you to:
   - Choose the wrapping tag (`div`, `section`, etc.).
   - Add optional `class` and `id` attributes.
6. Click **"Apply"** to wrap the selected text.

---

### **Method 2: Using the Right-Click Context Menu**
1. **Select the text** inside an HTML file.
2. **Right-click** and select **"WarpWrap: Wrap with Tag"**.
3. Choose the desired **tag** and optional **attributes** in the UI panel.
4. Click **"Apply"** to wrap the code.

---

### **Method 3: Using a Keyboard Shortcut**
*(Coming Soon in Future Updates)*  
You will be able to use a shortcut like `Ctrl+Alt+W` to quickly open WarpWrap.

---

## 🛠️ Project Structure

```
/warpwrap
│── /src
│   ├── extension.ts  # Main extension logic
│   ├── webview.html   # UI for the webview panel
│── package.json       # Extension metadata
│── tsconfig.json      # TypeScript configuration
│── README.md          # Project documentation
│── esbuild.js         # Build script
```

---

## 🤝 Contributing
We welcome contributions! Follow these steps to contribute:

1. **Fork the Repository** on GitHub.
2. **Clone your Fork**:
   ```sh
   git clone https://github.com/Sukhankar/WrapWrap
   ```
3. **Create a Branch**:
   ```sh
   git checkout -b feature-name
   ```
4. **Make Changes & Commit**:
   ```sh
   git commit -m "Added feature XYZ"
   ```
5. **Push to GitHub**:
   ```sh
   git push origin feature-name
   ```
6. **Create a Pull Request (PR)**.

---

## 🏗️ Future Scope
🔹 **Enhance UI Panel** to include a **live preview** of the wrapped content.  
🔹 **Add support for custom tags** beyond `div`, `span`, and `section`.  
🔹 **Provide theme customization options** for the UI.  
🔹 **Publish on VS Code Marketplace** for easy installation.  
🔹 **Add a keyboard shortcut** (`Ctrl+Alt+W`) for faster wrapping.  

---

## 📜 License
This project is licensed under the **MIT License**. Feel free to use and modify it.

---

## 💬 Need Help?
For any questions or feature requests, create an **Issue** on the repository.

📩 **Contact:** [sukhankarsh@gmail.com]  
📌 **GitHub:** [GitHub Repository](https://github.com/Sukhankar/WrapWrap)

---
