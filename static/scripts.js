var langArr = { main: [], others: [] };

var path = window.location.pathname;
var page = path.split("/").pop();
console.log(page);

function storeData() {
    localStorage.setItem(page + '-data', JSON.stringify(langArr));
}

function loadData() {
    if (localStorage.getItem(page + '-data') === null) {
        localStorage.setItem(page + '-data', JSON.stringify(langArr));
    }

    langArr = JSON.parse(localStorage.getItem(page + '-data'));
    console.log(langArr);
    console.log(typeof langArr);

    renderData();
}
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



function removeData(lang) {
    langArr.main = langArr.main.filter(item => item !== lang);
    langArr.others = langArr.others.filter(item => item !== lang);
    storeData();
    renderData();
}

function showError() {
    document.getElementById('error-panel').style.display = 'block';
}

function addData(event) {
    console.log(page)
    var lang = document.getElementById(page + '-input').value;
    if (!lang) {
        showError();
        return;
    }

    if (!langArr.main) {
        langArr.main = [];
    }
    if (!langArr.others) {
        langArr.others = [];
    }

    if ([...langArr.main, ...langArr.others].map(v => v.toLowerCase()).includes(lang.toLowerCase())) {
        showError();
        return;
    }
    console.log(lang);

    langArr.others.push(lang);
    storeData();
    renderData();

    document.getElementById(page + '-input').value = "";
    document.getElementById("error-panel").style.display = "none";
}



document.getElementById(page + '-input').onkeydown = function(event) {
    if (event.key === 'Enter') {
        addData(event);
    }
};

loadData();
