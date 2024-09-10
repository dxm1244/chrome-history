/* CONSTANTS */
const defaultLogo = '/icons/defaultIcon.png';
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* STATE */
//reference to each dayDiv by id
let dayDivs = {};
//the last history item to check or uncheck its checkbox
let lastChecked;
//number of history items
let itemCount = 0;
//loaded favicons
const favicons = {} 

/* EVENT HANDLERS */
let onScrollToBottom;
let onItemDeleted;

/* DOM ELEMENTS */
const historyDiv = document.getElementById('history');
const datePickerStart = document.getElementById('datePickerStart');
const datePickerEnd = document.getElementById('datePickerEnd');
const timePickerStart = document.getElementById('timePickerStart');
const timePickerEnd = document.getElementById('timePickerEnd'); 
const clearStartDateButton = document.getElementById('clearStartDateButton');
const clearEndDateButton = document.getElementById('clearEndDateButton');
const selectAllButton = document.getElementById('selectAllButton');
const deselectAllButton = document.getElementById('deselectAllButton');
const deleteButton = document.getElementById('deleteButton');
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const searchByUrl = document.getElementById('searchByUrl');
const searchByTitle = document.getElementById('searchByTitle');
const clearButton = document.getElementById('searchClearButton');

//allow scrolling on whole window
document.addEventListener('wheel', function(e){
    e.preventDefault();
    historyDiv.scrollBy(e.deltaX, e.deltaY);
}, {passive: false});

historyDiv.addEventListener('scroll', onScroll);

async function onScroll(e) {
    const ele = e.target;

    if(ele.scrollHeight - ele.scrollTop - ele.clientHeight < 1.1) {
        //prevent double triggering by removing and readding handler
        historyDiv.removeEventListener('scroll', onScroll);
        await onScrollToBottom?.();
        setTimeout(() => {
            historyDiv.addEventListener('scroll', onScroll);
        }, 100);
        //scroll up slightly to prevent retriggering
        ele.scrollTop = ele.scrollTop - 1.2;
    }
}

export function setOnScrollToBottom(handler) {
    onScrollToBottom = handler;
}

//initialize
function initQuery() {
    searchInput.value = '';
    const now = new Date();
    datePickerEnd.value = formatDatePickerValue(now);
    timePickerStart.value = formatTimePickerValue(new Date(9999, 1, 1));
    timePickerEnd.value = formatTimePickerValue(now);
}
initQuery();

clearStartDateButton.onclick = (e) => {
    datePickerStart.value = '';
    timePickerStart.value = formatTimePickerValue(new Date(9999, 1, 1));
}
clearEndDateButton.onclick = (e) => {
    datePickerEnd.value = '';
    timePickerEnd.value = formatTimePickerValue(new Date());
}

selectAllButton.onclick = () => {
    const elements = historyDiv.querySelectorAll('.itemCheckbox');
    for(const element of elements)
        element.checked = true;
}

deselectAllButton.onclick = () => {
    const elements = historyDiv.querySelectorAll('.itemCheckbox');
    for(const element of elements)
        element.checked = false;
}

const onKey = (key, callback) => {
    return (event) => {
        if (event.key === key)
            callback();
    }
}

export function setDeleteHandler(handler) {
    deleteButton.onclick = handler;
    document.addEventListener("keydown", onKey('Delete', handler)); 
}

export function setClearSearchHandler(handler) {
    clearButton.onclick = handler;
    clearButton.addEventListener("keydown", onKey('Enter', handler)); 
}

export function setSearchHandler(handler) {
    searchButton.onclick = handler;
    searchButton.addEventListener("keydown", onKey('Enter', handler)); 
    searchInput.addEventListener("keydown", onKey('Enter', handler)); 
}

export function deleteItem(item) {
    if(item.elements.checkbox === lastChecked)
        lastChecked = null;
    const parent = item.elements.div.parentElement;
    item.elements.div.remove();
    
    if(!parent.querySelector('.item')) {
        parent.remove();
        delete dayDivs[parent.id];
    }
}

export function setCanSearch(isDisabled) {
    searchButton.disabled = isDisabled;
    searchInput.disabled = isDisabled;
}

export function setOnItemDeleted(handler) {
    onItemDeleted = handler;
}

function formatDatePickerValue(date) {
    return date.getFullYear() + 
    '-' + (date.getMonth() + 1).toString().padStart(2, '0') +
    '-' + (date.getDate()).toString().padStart(2, '0')
}

function formatTimePickerValue(date) {
    return date.getHours().toString().padStart(2, '0') + 
    ':' + date.getMinutes().toString().padStart(2, '0')
}

function getFormattedDateAndTime(milliseconds) {
    let date = new Date(milliseconds);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const weekday = date.getDay();

    let amPm = 'AM';
    if(hour >= 12) {
        amPm = 'PM';
        hour -= 12;
    }

    if(hour === 0)
        hour = 12;

    return {
        date: `${year}-${month+1}-${day}`,
        friendlyDate: `${dayNames[weekday]}, ${monthNames[month]} ${day}, ${year}`,
        time: `${hour}:${minute} ${amPm}`
    } 
}

function getDomain(url) {
    let match = url.match(/https?:\/\/([^\/]*\/)/);
    match ??=  url.match(/file:[/S]*\/(.+)$/);
    match ??= [url, url];

    return {domain: match[0], displayDomain: match[1]};
}

function sanitize(text) {
    return text.replaceAll('"', '&quot;').
        replaceAll('<', '&lt;').
        replaceAll('>', '&gt;');
}

function checkboxRangeSelectHandler(e) {
    document.getSelection().removeAllRanges();
    if(e.shiftKey && lastChecked) {
        let current = +e.target.parentElement.id.substring(1);
        let prev = +lastChecked.parentElement.id.substring(1);
        let min = Math.min(current, prev);
        let max = Math.max(current, prev);
        for(let i = min; i <= max; i++)
            document.getElementById(`r${i}`).querySelector('.itemCheckbox').checked = e.target.checked;
    }
    lastChecked = e.target;
}

function getDeleteButtonClickHandler(item, itemDiv) {
    let i = item;
    let div = itemDiv;
    return function() {
        div.remove();
        onItemDeleted?.(i);
    }
}

export function clearSearch() {
    initQuery();
}

export function getQueryOptions() {
    try {
        const searchTitle = searchByTitle.checked;
        const searchUrl = searchByUrl.checked;
        const query = document.getElementById('search').value;

        let startDate = datePickerStart.value;
        const startTime = timePickerStart.value;
        if(startDate) {
            startDate = startDate + (startTime ? ` ${startTime}` : '');
            startDate = new Date(startDate);
        }
        else {
            startDate = null;
        }

        let endDate = datePickerEnd.value;
        const endTime = timePickerEnd.value;
        if(endDate) {
            endDate = endDate + (endTime ? ` ${endTime}` : '');
            endDate = new Date(endDate);
        }
        else {
            endDate = null;
        }

        return { query, searchTitle, searchUrl, startTime: startDate, endTime: endDate };
    }
    catch(err) {
        console.error(`Failed to create query options object: ${err}`);
        return {};
    }
}

export function clear() {
    lastChecked = null;
    dayDivs = {};
    historyDiv.innerHTML = '';
    itemCount = 0;
}

export async function addItem(item) {
    //docs say items come back in reverse chronological order
    const formattedDateTime = getFormattedDateAndTime(item.lastVisitTime);

    //create a container for the day if it is a new day
    const dayId = `day${formattedDateTime.date}`;
    if(!dayDivs[dayId]) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.classList.add('glowBorder')
        dayDiv.id = dayId;
        dayDiv.innerHTML = `<span id="" class="dayTitle">${formattedDateTime.friendlyDate}</span>`;
        dayDivs[dayId] = dayDiv;
        historyDiv.appendChild(dayDiv);
    }

    //get favicon url, if none or error show default icon
    let { domain, displayDomain } = getDomain(item.url);
    const domainUpper = formatFaviconKey(domain);

    let faviconSrc = defaultLogo;
    if(!favicons[domainUpper]) {
        try {
            const faviconUrl = await getFavicon(domainUpper);
            if(faviconUrl) {
                const result = await fetch(faviconUrl);
                const blob = await result.blob();
                favicons[domainUpper] = URL.createObjectURL(blob);
            }
        }
        catch(err) {
            console.error(`Failed to load blob ${domain}: ${err.message || err}`);
            favicons[domainUpper] = defaultLogo;
        }
    }
    faviconSrc = favicons[domainUpper] || defaultLogo;

    //Note: Could enable use of this api to fetch favicons that are missing, but would be sending 
    //entire search history to Google. 
    //`https://www.google.com/s2/favicons?domain=${domain}&sz=16`

    const sanitizedUrl = sanitize(item.url);
    const displayTitle = sanitize(item.title ?? item.url);
    displayDomain = sanitize(displayDomain);
    const sanitizedSrc = sanitize(faviconSrc);

    //add item to the display
    let itemDiv = document.createElement('div');
    itemDiv.classList.add('item');
    itemDiv.innerHTML = `
    <input type="checkbox" class="checkbox itemCheckbox" />
    <div id="" class="itemTime">
        <span id="">${formattedDateTime.time}</span>
    </div>
    <div id="" class="linkContainer">
        <a id="" class="link" href="${sanitizedUrl}">
            <img id="" class="favicon" src="${sanitizedSrc}">
            <span id="" class="title" title="${displayTitle}">${displayTitle}</span>
            <span id="" class="url" title="${sanitizedUrl}">${displayDomain}</span>
        </a>
    </div>
    <button class="deleteButton">X</button>
    `
    
    const checkbox = itemDiv.querySelector('.itemCheckbox');
    itemDiv.id = `r${itemCount}`;
    itemCount++;

    checkbox.addEventListener('click', checkboxRangeSelectHandler);

    //Shows favicon or default icon
    const favicon = itemDiv.querySelector('.favicon');
    favicon.src = faviconSrc;
    favicon.onerror = (e) => {
        e.target.src = defaultLogo;
    }

    //Hook up delete button on click function
    const button = itemDiv.querySelector('.deleteButton');
    button.onclick = getDeleteButtonClickHandler(item, itemDiv);

    dayDivs[dayId].appendChild(itemDiv);

    return {
        div: itemDiv,
        checkbox
    }
}