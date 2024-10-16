var langArr = [];

var path = window.location.pathname;
var page = path.split("/").pop();
console.log( page );


function storeData() {
        localStorage.setItem(page + '-data', JSON.stringify(langArr));
}

function loadData() {
        if (localStorage.getItem(page + '-data') === null) {
            localStorage.setItem(page + '-data', JSON.stringify(langArr));
        }
        
        langArr = JSON.parse(localStorage.getItem(page + '-data'));
        console.log(langArr)
        console.log(typeof langArr);

        for (let i = 0; i < langArr.length; i++) {
            var langLink = document.createElement('a');
            langLink.classList.add("list-item");
            langLink.innerHTML = langArr[i];
            document.getElementById('con1').appendChild(langLink);
            document.getElementById('con1').appendChild(document.createElement('br'));
            document.getElementById('con1').appendChild(document.createElement('br'));
        }
    }

function removeData() {
    langArr = JSON.parse(localStorage.getItem(page + '-data'));
    langArr.pop()
    localStorage.setItem(page + '-data', JSON.stringify(langArr));

    var list = document.getElementsByClassName('list-item');
    list[list.length - 1].remove()

    var separator = document.getElementById('con1').getElementsByTagName("br");
    for (let i = 0; i < 2; i++) {
        document.getElementById('con1').removeChild(separator[separator.length - 1]);
    }

    console.log(separator);
    console.log(list);
}
function showError() {
    document.getElementById('error-panel').style.display = 'block';
}

function addData(event) {
    var lang = document.getElementById(page + '-input').value;

    if (langArr.map(v => v.toLowerCase()).includes(lang.toLowerCase())) {
        showError();
        return;
    }
    console.log(lang);
    var langLink = document.createElement('a');
    langLink.classList.add("list-item");
    langLink.innerHTML = lang;

    document.getElementById('con1').appendChild(langLink);
    langArr.push(lang);

    document.getElementById('con1').appendChild(document.createElement('br'));
    document.getElementById('con1').appendChild(document.createElement('br'));

    document.getElementById(page + '-input').value = "";
    console.log(langArr);
    document.getElementById("error-panel").style.display = "none";
}

document.getElementById(page + '-input').onkeydown = function(event) {
    if (event.key === 'Enter') {
        addData(event);
    }
};




