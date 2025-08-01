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
    if (!path.includes('hosting')) {
        localStorage.setItem(var_name, JSON.stringify(langArr));
    } 
}

// Loads the data for that page from local storage.
function loadData() {
    if (path.includes('hosting')) {
        var name = 'hosting-data';
        if (JSON.parse(localStorage.getItem('edit')) === true) {
            name = 'hosting-data-edit';
        }
        var existingData = JSON.parse(localStorage.getItem(name)) || {};
        langArr = {
            main: [],
            others: Array.isArray(existingData.others) ? existingData.others : []
        };
    } else {
        const stored = localStorage.getItem(var_name);
        let parsed = safeJsonParse(stored, null);
        // Fallback if data is missing or invalid
        if (!parsed || typeof parsed !== 'object') {
            langArr = { main: [], others: [] };
        } else {
            // Ensure main and others are arrays
            langArr = {
                main: Array.isArray(parsed.main) ? parsed.main : [],
                others: Array.isArray(parsed.others) ? parsed.others : []
            };
        }
    }

    renderData();
}


// Renders data from the local storage into the table. This is used when we add multiple entries.
// For example, when we use Autosuggest on /database we can add multiple lines of data to the table.
function renderData() {
    var tableBody = document.querySelector('#table-list tbody');
    tableBody.innerHTML = '';

    if (path.includes('hosting')) {
        var name = 'hosting-data';
        if (JSON.parse(localStorage.getItem('edit')) === true) {
            name = 'hosting-data-edit';
        }
        var raw = localStorage.getItem(name);
        var data = raw ? JSON.parse(raw) : {};
        var providers = Array.isArray(data.others) ? data.others : [];
        providers.forEach(function(provider, idx) {
            var newRow = document.createElement('tr');
            newRow.classList.add('ons-table__row');
            var cloudCell = document.createElement('td');
            cloudCell.classList.add('ons-table__cell');
            cloudCell.textContent = `${provider}`;

            var buttonCell = document.createElement('td');
            buttonCell.classList.add('ons-table__cell');
            var button = document.createElement('button');
            button.type = 'button';
            button.classList.add('ons-btn', 'ons-btn--secondary', 'ons-btn--small');
            button.onclick = function() { removeData(provider); };
            var buttonInner = document.createElement('span');
            buttonInner.classList.add('ons-btn__inner');
            var buttonText = document.createElement('span');
            buttonText.classList.add('ons-btn__text');
            buttonText.textContent = 'Remove';
            buttonInner.appendChild(buttonText);
            button.appendChild(buttonInner);
            buttonCell.appendChild(button);

            newRow.appendChild(cloudCell);
            newRow.appendChild(buttonCell);
            tableBody.appendChild(newRow);
        });
        return;
    }

    [...(langArr.main || []), ...(langArr.others || [])].forEach(lang => {
        var newRow = document.createElement('tr');
        newRow.classList.add('ons-table__row');

        newRow.innerHTML = `
            <td class="ons-table__cell">${escapeHTML(lang)}</td>
            ${(path.includes('languages') || path.includes('publishing') ) ? `
            <td class="ons-table__cell">
                <div class="ons-input-items">
                    <div class="ons-radios__items">
                        <span class="ons-radios__item">
                            <span class="ons-radio">
                                <input type="radio" id="${escapeHTML(lang)}-main" class="ons-radio__input ons-js-radio" value="main" name="${escapeHTML(lang)}-role" ${langArr.main.includes(lang) ? 'checked' : ''}>
                                <label class="ons-radio__label" for="${escapeHTML(lang)}-main">${path.includes('languages') ? 'Yes' : 'Internal'}</label>
                            </span>
                        </span>
                        <span class="ons-radios__item">
                            <span class="ons-radio">
                                <input type="radio" id="${escapeHTML(lang)}-other" class="ons-radio__input ons-js-radio" value="other" name="${escapeHTML(lang)}-role" ${langArr.others.includes(lang) ? 'checked' : ''}>
                                <label class="ons-radio__label" for="${escapeHTML(lang)}-other">${path.includes('languages') ? 'No' : 'External'}</label>
                            </span>
                        </span>
                    </div>
                </div>
            </td>
            ` : ''}
            <td class="ons-table__cell" >
                <button type="button" class="ons-btn ons-btn--secondary ons-btn--small" onclick='removeData("${escapeHTML(lang)}")'>
  <span class="ons-btn__inner"><span class="ons-btn__text">Remove</span></span>
</button>
            </td>
        `;

        tableBody.appendChild(newRow);

        if (path.includes('languages') || path.includes('publishing')) {
            // Add event listeners for the radio buttons
            document.getElementById(`${escapeHTML(lang)}-main`).addEventListener('change', () => changeListItemType(lang, 'main'));
            document.getElementById(`${escapeHTML(lang)}-other`).addEventListener('change', () => changeListItemType(lang, 'other'));
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
    if (path.includes('hosting')) {
        var name = 'hosting-data';
        if (JSON.parse(localStorage.getItem('edit')) === true) {
            name = 'hosting-data-edit';
        }
        var raw = localStorage.getItem(name);
        var data = raw ? JSON.parse(raw) : {};
        if (!Array.isArray(data.others)) data.others = [];
        data.others = data.others.filter(function(item) { return item !== lang; });
        localStorage.setItem(name, JSON.stringify(data));
        renderData();
        return;
    }

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

    if (path.includes('hosting')) {
        var name = 'hosting-data';
        if (JSON.parse(localStorage.getItem('edit')) === true) {
            name = 'hosting-data-edit';
        }
        var raw = localStorage.getItem(name);
        var data = raw ? JSON.parse(raw) : {};
        if (!Array.isArray(data.others)) data.others = [];
        // Prevent duplicates (case-insensitive)
        if (data.others.map(v => v.toLowerCase()).includes(lang.toLowerCase())) {
            showError();
            return;
        }
        data.others.push(lang);
        localStorage.setItem(name, JSON.stringify(data));
        renderData();
        inputElement.value = "";
        document.getElementById('error-panel').classList.add('ons-u-hidden');
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

// Rule: Escape meta-characters
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m =>
        ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]
    );
}


// When the user is entering in the Autosuggest, if they press enter then it will add the data.
var inputElement = document.getElementById(page + '-input');
if (inputElement) {
    inputElement.onkeydown = function(event) {
        if (event.key === 'Enter') {
            addData(event);
        }
    };
}

loadData();
