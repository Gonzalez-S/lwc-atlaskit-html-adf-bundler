# AtlasKit HTML ↔ ADF Transformer

A webpack bundler that creates a single JavaScript file containing AtlasKit libraries for converting HTML to ADF (Atlassian Document Format) format and vice versa.

## What is this?

This project bundles the following AtlasKit packages into a single JavaScript file:
- `@atlaskit/adf-schema` - ADF schema definitions
- `@atlaskit/editor-jira-transformer` - HTML to ProseMirror transformer
- `@atlaskit/editor-json-transformer` - ProseMirror to ADF transformer

## Why is this needed?

AtlasKit packages are designed for Node.js environments and have complex dependencies. To use them in browser environments (like Salesforce Lightning Web Components), we need to:
1. Bundle all dependencies into a single file
2. Resolve module imports
3. Make it available as a global object (`window.AtlasKit`)

## How to build

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the bundle:**
   ```bash
   npm run build
   ```

3. **The output file** will be created at `dist/atlaskit-bundle.js`

### What happens during build?

- Webpack bundles all AtlasKit packages and their dependencies
- Code is minified and optimized for production
- Creates a UMD module that works in browsers
- Exports `AtlasKit` as a global object

## Usage

After building, you can use the bundle in any web application:

```javascript
// Load the bundle
<script src="atlaskit-bundle.js"></script>

// HTML to ADF conversion
const html = '<p>This is <strong>bold</strong> text.</p>';
const adf = window.AtlasKit.htmlToADF(html);
console.log(adf);

// ADF to HTML conversion
const adfObject = {
    "version": 1,
    "type": "doc",
    "content": [
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "This is ",
                    "marks": []
                },
                {
                    "type": "text",
                    "text": "bold",
                    "marks": [{"type": "strong"}]
                },
                {
                    "type": "text",
                    "text": " text.",
                    "marks": []
                }
            ]
        }
    ]
};
const htmlOutput = window.AtlasKit.adfToHTML(adfObject);
console.log(htmlOutput); // <p>This is <strong>bold</strong> text.</p>
```

## Output

The bundle creates a global `AtlasKit` object with:
- `htmlToADF(htmlString)` - Converts HTML to ADF format
- `adfToHTML(adfObject)` - Converts ADF to HTML format
- `defaultSchema` - Default ADF schema
- `JIRATransformer` - JIRA-specific transformer
- `JSONTransformer` - JSON transformer
- `makeJiraSchema` - Schema factory function

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [AtlasKit](https://atlaskit.atlassian.com/) - The original Atlassian Design System
- [ProseMirror](https://prosemirror.net/) - The rich text editor framework
- [Webpack](https://webpack.js.org/) - The module bundler