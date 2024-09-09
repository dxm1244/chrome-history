let lastSearchOptions = {};
let isDoneLoading = false;

export async function deleteItem(item) {
    await browser.history.deleteRange({ startTime: item.lastVisitTime, endTime: item.lastVisitTime});
}

export async function clear() {
    lastSearchOptions = {};
    isDoneLoading = false;
}

export async function continueSearch() {
    return !isDoneLoading ? await search(lastSearchOptions) : [];
}

export async function search(options) {
    lastSearchOptions = options;
    let { query, searchTitle, searchUrl, startTime, endTime } = options;

    if(endTime)
        endTime = endTime - 1;
    else
        isDoneLoading = false;

    startTime ??= 0;

    const willQuery = (!!query && !/^\s*$/.test(query)) && (searchTitle || searchUrl);

    //turn both into milliseconds
    startTime = startTime && startTime.getTime ? startTime.getTime() : startTime;
    endTime = endTime && endTime.getTime ? endTime.getTime() : endTime;

    let params = {
        text: willQuery ? query : '',
        startTime,
        endTime,
        maxResults: 250
    };
    let items = await browser.history.search(params);

    lastSearchOptions.startTime = startTime;
    if(items.length) {
        const lastItem = items[items.length-1];
        if(!lastSearchOptions.endTime || lastItem.lastVisitTime < lastSearchOptions.endTime)
            lastSearchOptions.endTime = lastItem.lastVisitTime;
    }
    else {
        lastSearchOptions.endTime = startTime;
    }

    //filter by date again because a but in the firefox history api keep returning elements that are outside the range
    const badHistory = items.filter(x => x.lastVisitTime < startTime || (endTime && x.lastVisitTime > endTime));
    if(badHistory.length) {
        console.error(`Selected date range: ${new Date(startTime)} - ${new Date(endTime)}`);
        console.error(`    Bad dates found: ${badHistory.length}`);
        badHistory[0].lastVisitTimeDisplay = new Date(badHistory[0].lastVisitTime);
        console.error(`    Item #1 Url: ${badHistory[0].url}`);
        console.error(`    Item #1 Title: ${badHistory[0].title}`);
        console.error(`    Item #1 Date: ${new Date(badHistory[0].lastVisitTime)}`);
    }
   
    items = items.filter(x => x.lastVisitTime >= startTime && (!endTime || x.lastVisitTime <= endTime));

    if(items.length === 0) {
        isDoneLoading = true
        return;
    }

    //history api searches title and url by default
    //if both types of search or unchecked perform neither
    //otherwise filter out all results that match the specified search type
    if(willQuery && searchTitle ^ searchUrl) {
        const filterProp = searchTitle ? 'title' : 'url';
        const queryUpper = query.toUpperCase();
        items = items.filter(x => {
            return x[filterProp]?.toUpperCase().includes(queryUpper);
        });
    }

    return items;
}