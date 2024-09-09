const formatFaviconKey = (key) => {
    return key.toUpperCase().replace(/\/+$/, '');
}

const setFavicon = async (key, value) => {
    try {
        key = formatFaviconKey(key);
        const obj = {[key]: value};
        await browser.storage.local.set(obj);
    }
    catch(err) {
        //do nothing
    }
}

const getFavicon = async (key) => {
    try {
        key = formatFaviconKey(key);
        const favicon = await browser.storage.local.get([key]);
        return favicon[key];
    }
    catch(err) {
        return null;
    }
}