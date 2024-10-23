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

    [...langArr.main, ...langArr.others].forEach(lang => {
        var newRow = document.createElement('tr');
        newRow.classList.add('ons-table__row');

        newRow.innerHTML = `
            <td class="ons-table__cell">${lang}</td>
            <td class="ons-table__cell">${langArr.main.includes(lang) ? 'Main' : 'Other'}</td>
            <td class="ons-table__cell" style='display:flex;justify-content: space-between;cursor: pointer;'>
                <a onclick='changeListItemType("${lang}")' class="ons-summary__button">
                    <span class="ons-summary__button-text" aria-hidden="true">Toggle Type</span>
                </a>
                <a onclick='removeData("${lang}")' class="ons-summary__button">
                    <span class="ons-summary__button-text" aria-hidden="true">Remove</span>
                </a>
            </td>
        `;

        tableBody.appendChild(newRow);
    });
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

function changeListItemType(lang) {
    if (langArr.main.includes(lang)) {
        langArr.main = langArr.main.filter(item => item !== lang);
        langArr.others.push(lang);
    } else {
        langArr.others = langArr.others.filter(item => item !== lang);
        langArr.main.push(lang);
    }
    storeData();
    renderData();
}

document.getElementById(page + '-input').onkeydown = function(event) {
    if (event.key === 'Enter') {
        addData(event);
    }
};

loadData();
