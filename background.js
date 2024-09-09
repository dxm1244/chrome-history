browser.action.onClicked.addListener((event) => {
    browser.tabs.create({
        url: browser.runtime.getURL('better-history.html')
    });
});