var langArr = { main: [], others: [] };
var path = window.location.pathname;
var page = path.split("/").pop();

var var_name = page + '-data';
if (JSON.parse(localStorage.getItem('edit')) === true) {
    var_name = var_name + '-edit';
}

function safeJsonParse(jsonString, fallback = {}) {
    try {
        return jsonString ? JSON.parse(jsonString) : fallback;
    } catch (e) {
        console.error("JSON parse error:", e);
        return fallback;
    }
}

// Stores the data for that page in local storage.
function storeData() {
    localStorage.setItem(var_name, JSON.stringify(langArr));
}

// Loads the data for that page from local storage.
function loadData() {
    const stored = localStorage.getItem(var_name);
    let parsed = safeJsonParse(stored, null);

    // Fallback if data is missing or invalid
    if (!parsed || typeof parsed !== 'object') {
        console.warn("No valid stored data found. Initializing langArr.");
        langArr = { main: [], others: [] };
        storeData(); // save the empty structure
    } else {
        // Ensure main and others are arrays
        langArr = {
            main: Array.isArray(parsed.main) ? parsed.main : [],
            others: Array.isArray(parsed.others) ? parsed.others : []
        };
    }

    console.log("Initialized langArr:", langArr);
    renderData();
}


// Renders data from the local storage into the table. This is used when we add multiple entries.
// For example, when we use Autosuggest on /database we can add multiple lines of data to the table.
function renderData() {
    var tableBody = document.querySelector('#table-list tbody');
    tableBody.innerHTML = '';

    [...(langArr.main || []), ...(langArr.others || [])].forEach(lang => {
        var newRow = document.createElement('tr');
        newRow.classList.add('ons-table__row');

        newRow.innerHTML = `
            <td class="ons-table__cell">${lang}</td>
            ${path.includes('languages') ? `
            <td class="ons-table__cell">
                <div class="ons-input-items">
                    <div class="ons-radios__items">
                        <span class="ons-radios__item">
                            <span class="ons-radio">
                                <input type="radio" id="${lang}-main" class="ons-radio__input ons-js-radio" value="main" name="${lang}-role" ${langArr.main.includes(lang) ? 'checked' : ''}>
                                <label class="ons-radio__label" for="${lang}-main">Yes</label>
                            </span>
                        </span>
                        <span class="ons-radios__item">
                            <span class="ons-radio">
                                <input type="radio" id="${lang}-other" class="ons-radio__input ons-js-radio" value="other" name="${lang}-role" ${langArr.others.includes(lang) ? 'checked' : ''}>
                                <label class="ons-radio__label" for="${lang}-other">No</label>
                            </span>
                        </span>
                    </div>
                </div>
            </td>
            ` : ''}
            <td class="ons-table__cell" >
                <button type="button" class="ons-btn ons-btn--secondary ons-btn--small" onclick='removeData("${lang}")'>
  <span class="ons-btn__inner"><span class="ons-btn__text">Remove</span></span>
</button>
            </td>
        `;

        tableBody.appendChild(newRow);

        if (path.includes('languages')) {
            // Add event listeners for the radio buttons
            document.getElementById(`${lang}-main`).addEventListener('change', () => changeListItemType(lang, 'main'));
            document.getElementById(`${lang}-other`).addEventListener('change', () => changeListItemType(lang, 'other'));
        }
    });
}

// Used for the languages page to change the type of the language from main to other and vice versa.
function changeListItemType(lang, type) {
    if (type === 'main') {
        langArr.main = langArr.main.filter(item => item !== lang);
        langArr.others = langArr.others.filter(item => item !== lang);
        langArr.main.push(lang);
    } else {
        langArr.main = langArr.main.filter(item => item !== lang);
        langArr.others = langArr.others.filter(item => item !== lang);
        langArr.others.push(lang);
    }
    storeData();
    renderData();
}

// Removes the data from the local storage and re-renders the table.
function removeData(lang) {
    langArr.main = langArr.main.filter(item => item !== lang);
    langArr.others = langArr.others.filter(item => item !== lang);
    storeData();
    renderData();
}

// Shows the error panel when the user tries to add a language that already exists.
function showError() {
    document.getElementById('error-panel').classList.remove('ons-u-hidden');
}

// Adds the data from the autosuggest to local storage and re-renders the table.
function addData(event) {
    const inputElement = document.getElementById(page + '-input');
    const lang = inputElement?.value?.trim();

    if (!lang) {
        showError();
        return;
    }

    console.log("langArr before adding:", langArr);

    // Ensure langArr is properly initialized
    if (!langArr || typeof langArr !== 'object') {
        console.warn("langArr was not an object. Reinitializing.");
        langArr = { main: [], others: [] };
    }

    // Ensure arrays are valid
    if (!Array.isArray(langArr.main)) langArr.main = [];
    if (!Array.isArray(langArr.others)) langArr.others = [];

    const allLangs = [...langArr.main, ...langArr.others].map(v => v.toLowerCase());
    if (allLangs.includes(lang.toLowerCase())) {
        showError();
        return;
    }

    langArr.others.push(lang);
    storeData();
    renderData();

    inputElement.value = "";
    document.getElementById('error-panel').classList.add('ons-u-hidden');
}


// When the user is entering in the Autosuggest, if they press enter then it will add the data.
document.getElementById(page + '-input').onkeydown = function(event) {
    if (event.key === 'Enter') {
        addData(event);
    }
};

loadData();
