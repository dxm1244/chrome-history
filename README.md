This repo is a Firefox extension to implement a simple, plain JS history browser that has a similar look and feel to Chrome's history page. I've long found Firefox's default history to be inadequate and other extensions to be much heavier than needed. This extension still relies on Firefox's [History API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history) and is subject to any limitations of that API.

The extension has 3 parts defined in the manifest:

1. A button that opens the new history page.

2. The history page itself.

3. A content script that runs on all websites to harvest favicon URLs.

## Development

The add-in can be loaded into Firefox temporarily by browsing to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) in Firefox and loading in the **manifest.json**