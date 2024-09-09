import * as elements from "./js/elements.js";
import * as history from "./js/history.js";

let historyItems = [];

//remove visits to history page from user history
browser.history.onVisited.addListener((historyItem) => {
    if (historyItem.url === browser.runtime.getURL('better-history.html'))
        browser.history.deleteUrl({ url: historyItem.url });
});


elements.setDeleteHandler(() => {
    const newHistoryItems = [];
    for(const item of historyItems) {
        if(item.elements.checkbox.checked) {
            elements.deleteItem(item);
            history.deleteItem(item);
        }
        else {
            newHistoryItems.push(item);
        }
    }
    historyItems = newHistoryItems;
});

elements.setClearSearchHandler(() => {
    elements.clearSearch();
    clearHistory();
    search();
});

elements.setSearchHandler(async () => {
    elements.setCanSearch(true);
    try {
        clearHistory();
        const options = elements.getQueryOptions();
        await search(options);
    }
    catch(err) {
        console.error(`ERROR: ${err}`);
    }
    finally {
        elements.setCanSearch(false);
    }
});

elements.setOnScrollToBottom(async () => {
    const items = await history.continueSearch();
    await processSearchResults(items);
});

elements.setOnItemDeleted(async (item) => {
    await history.deleteItem(item);
});

function clearHistory() {
    history.clear();
    elements.clear();
    historyItems = [];
}

async function search(options = {}) {
    const items = await history.search(options);
    await processSearchResults(items);
}

async function processSearchResults(items) {
    for(const item of items) {
        const domElements = await elements.addItem(item);
        historyItems.push({
            elements: domElements,
            ...item
        });
    }
}

// Debugger: about:debugging#/runtime/this-firefox
// HISTORY API: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/history

search();