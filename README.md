# Obsidian EditorConfig Plugin

This plugin automatically formats Markdown files in your Obsidian vault according to your `.editorconfig` settings. It uses the [editorconfig](https://editorconfig.org/) library and supports indentation, trailing whitespace, final newline, and end-of-line style for Markdown files.

## Features
- Automatically formats Markdown files on modification
- Command to manually format the active Markdown file
- Respects `.editorconfig` settings for indentation, trailing whitespace, final newline, and end-of-line

## Installation

### Manual
1. Clone this repository or download the release files.
2. Copy `main.js`, `manifest.json`, and `styles.css` to your vault folder: `VaultFolder/.obsidian/plugins/obsidian-editorconfig-plugin/`
3. Enable the plugin in Obsidian's settings.

## Development

1. Make sure you have Node.js (v16 or newer) installed.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start compilation in watch mode.
4. Edit files in the `src/` directory. Changes will be compiled automatically.
5. Reload Obsidian to load the new version of your plugin.

## Usage
- The plugin will automatically format Markdown files when they are modified.
- You can manually format the active Markdown file using the command palette: `Editorconfig: Format file with editorconfig`.

## Configuration
- Place a `.editorconfig` file in your vault root or any subfolder. The plugin will use the closest `.editorconfig` file for each Markdown file.
- Supported properties: `indent_style`, `indent_size`, `trim_trailing_whitespace`, `insert_final_newline`, `end_of_line`.

## Code Quality
- This project uses TypeScript for type safety.
- You can use ESLint to analyze code quality:
	- Install ESLint: `npm install -g eslint`
	- Run: `eslint ./src/`
