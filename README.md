# Owlbear Link Opener 🔗

An ultra-minimalist, lightweight extension for **[Owlbear Rodeo 2.0](https://owlbear.rodeo/)** that lets you attach web links with custom names to tokens and attachments. Clicking the link opens it directly in a new browser tab.

---

## 🚀 Live Manifest (Install URL)

To install this extension in Owlbear Rodeo, copy and paste this link:

```text
https://guilhermlma.github.io/owlbear-link-opener/manifest.json
```

---

## 🛠️ How to Install in Owlbear Rodeo

1. Open any room in [Owlbear Rodeo](https://owlbear.rodeo/).
2. Click your **Profile Icon** (or room menu) > **Extensions**.
3. Click the **`+` (Add Extension)** button.
4. Paste the URL:
   ```text
   https://guilhermlma.github.io/owlbear-link-opener/manifest.json
   ```
5. Click **Install**.
6. Ensure the extension is enabled in your room.

---

## 💡 How It Works

- **Add Link**: Select any token or attachment on the map. Click **Add Link** in the context menu. Enter the target URL and an optional custom name (e.g., `Character Sheet`, `Monster Stats`, `Inventory`).
- **Open Link**: The context menu dynamically displays your custom name (or `Open Link`). **Anyone in the room (including players with zero permissions)** can click it to open the link in a new browser tab.
- **Remove Link**: If you have permission to edit the token, you can click **Remove Link** at any time to clear it.
- **Zero Clutter**: No heavy popovers, no modals, and no action buttons clogging your toolbar—it runs silently in the background and integrates seamlessly into Owlbear Rodeo's native context menu.

---

## 💻 Local Development

Run the local development server (with CORS enabled):

```bash
python serve.py 5173
```

Then in Owlbear Rodeo, add the local manifest:
```text
http://localhost:5173/manifest.json
```

---

## 📚 Owlbear Rodeo Development Documentation

This repository also contains a comprehensive knowledge base for building Owlbear Rodeo 2.0 extensions:

1. **[01. Architecture & Manifest](docs/01_ARCHITECTURE_AND_MANIFEST.md)** — Execution model, sandboxed iframes, and `manifest.json` specification.
2. **[02. SDK API Reference](docs/02_SDK_API_REFERENCE.md)** — Complete API documentation for all `OBR` namespaces.
3. **[03. Items & Builders](docs/03_ITEMS_AND_BUILDERS.md)** — Working with shapes, images, tokens, attachments, and layers.
4. **[04. Design Patterns & Recipes](docs/04_PATTERNS_AND_RECIPES.md)** — Practical implementation patterns for real-world extensions.
5. **[05. Setup & Boilerplate](docs/05_SETUP_AND_BOILERPLATE.md)** — Project structures, Vite configuration, and multi-cloud deployment.
6. **[LLM System Prompt](docs/LLM_SYSTEM_PROMPT.md)** — High-density prompt template for contextualizing AI coding assistants.
