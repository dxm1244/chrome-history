(async () => {
    try {
        //only get favicon if none is present
        await setFavicon(window.location.origin, null);
        if(await getFavicon(window.location.origin))
            return;

        //Get favicon url candidates
        /* Searching for these favicon sources
        ....<link rel="shortcut icon" href="/favicon.ico" />
        ....<link rel="icon" href="/favicon.png" />
        ....${domain}/favicon.ico
        */
        let elements = Array.from(document.querySelectorAll("link[rel='icon']"));
        elements = elements.concat(Array.from(document.querySelectorAll("link[rel='shortcut icon']")));
        elements.sort((a, b) => {
            let aVal = Number(a.getAttribute('sizes')?.match(/\d+/)?.[0]);
            let bVal = Number(b.getAttribute('sizes')?.match(/\d+/)?.[0]);
            return aVal && bVal ? aVal - bVal : (!aVal ? aVal : bVal);
        })
        const faviconUrls = [];
        elements.forEach(element => {
            const href = element.getAttribute('href');
            faviconUrls.push(new URL(href, document.baseURI).href);
        });
        faviconUrls.push(new URL('favicon.ico', window.location.origin).href);

        for(const url of faviconUrls) {
            try {
                const result = await fetch(url);
                if(result.status === 200) {
                    setFavicon(window.location.origin, url);
                    return;
                }           
            }
            catch(err) {
                //do nothing
            }
        }
    }
    catch(err) {
        //do nothing
    }
})();

