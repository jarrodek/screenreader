# The Screen Reader Browser Extension

An extension for a web browser that read text on a web page using a built-in text-to-speech service.

## How it works?

Once the extension is installed, it loads a script (a content script) onto every page you visit. This script manipulates the website by:

- highlighting the currently hovered node that can be read aloud using a text-to-speech service.
- replacing hovered images with a higher contrast version.
- More may to come after a feedback from users.

## Limitations

### TTS engine limitations

Text-to-speech engine limitations apply. You can select the voice (usually with different capabilities) after clicking on the extension's icon. For example, some engines will mispronounce some words or ignore punctuation. Nothing this extension can do about.

### Image processing limitations

The image contrast is changed on data read from an HTML Canvas. This has a limitation of CORS (cross-origin resource sharing). If the image comes from another domain that does not support cors (or explicitly prohibits resource sharing), such an image won't be processed.

## Feedback

Please, file an issue with this repository. I'll try to answer as fast as possible.

## Development

### Bundling

The bundler is a script located in the `scripts/bundle.js` file. During the bundling process, the version from the `package.json` file is copied to `manifest.json`. Do not update the manifest's version manually. Update `package.json`'s version instead. Version bump is not automated.

### Releasing

The release process goes through the GitHub's CI pipeline. After tests are performed, a tag release (GitHub) is created. After that an action is triggered that use CWS' REST API to upload the extension to the store as **draft**. The final release is triggered by the author, manually in the CWS console.
