// Project dependencies localStorage setup and helpers
window.projectDependencies = {
    getName: function() {
        return (JSON.parse(localStorage.getItem('edit'))) ? 'project_dependencies-data-edit' : 'project_dependencies-data';
    },
    langArr: [],
    storeData: function() {
        localStorage.setItem('project_dependencies-data', JSON.stringify(this.langArr));
        localStorage.setItem('project_dependencies-data-edit', JSON.stringify(this.langArr));
    },
    loadData: function() {
        let name = this.getName();
        let raw = localStorage.getItem(name);
        try {
            let parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                throw new Error("Invalid data format");
            }
            this.langArr = parsed;
        } catch (e) {
            console.warn("Resetting langArr due to invalid or missing data:", e);
            this.langArr = [];
            localStorage.setItem(name, JSON.stringify(this.langArr));
        }
    }
};

// Handles populating the project dependencies select dropdown from the API

document.addEventListener('DOMContentLoaded', function() {
    fetch('/project_names_list')
      .then(response => response.json())
      .then(data => {
        const select = document.getElementById('project_dependencies-select');
        if (select && Array.isArray(data)) {
          data.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
          });
        }
      });
});

// --- Project Dependencies Table and Form Logic ---

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"]/g, function (c) {
        return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c];
    });
}

window.renderData = function() {
    var tableBody = document.querySelector('#table-list tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    (projectDependencies.langArr || []).forEach(item => {
        var newRow = document.createElement('tr');
        newRow.classList.add('ons-table__row');
        newRow.innerHTML = `
            <td class="ons-table__cell">${escapeHtml(item.name)}</td>
            <td class="ons-table__cell">${escapeHtml(item.description)}</td>
            <td class="ons-table__cell">
                <button type="button" class="ons-btn ons-btn--secondary ons-btn--small" onclick='removeData("${escapeHtml(item.name)}")'>
                    <span class="ons-btn__inner"><span class="ons-btn__text">Remove</span></span>
                </button>
            </td>
        `;
        tableBody.appendChild(newRow);
    });
}

window.removeData = function(name) {
    projectDependencies.langArr = projectDependencies.langArr.filter(item => item.name !== name);
    projectDependencies.storeData();
    renderData();
}

window.showError = function() {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
        errorPanel.style.display = 'block';
        errorPanel.classList.remove('ons-u-hidden');
    }
}

window.hideError = function() {
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
        errorPanel.style.display = 'none';
        errorPanel.classList.add('ons-u-hidden');
    }
}

window.addData = function(event) {
    var select = document.getElementById('project_dependencies-select');
    var manual = document.getElementById('project_dependencies-input').value.trim();
    var prodep = manual || select.value;
    var desc = document.getElementById('project_dependencies_desc-input').value;
    if (!prodep || !desc) {
        showError();
        return;
    }
    try {
        if (projectDependencies.langArr.some(item => item.name.toLowerCase() === prodep.toLowerCase())) {
            showError();
            return;
        } else {
            hideError();
        }
    } catch (e) {
        console.error(e);
    }
    projectDependencies.langArr.push({name: prodep, description: desc});
    projectDependencies.storeData();
    renderData();
    select.value = '';
    document.getElementById('project_dependencies-input').value = '';
    document.getElementById('project_dependencies_desc-input').value = '';
    document.getElementById("error-panel").style.display = "none";
}

document.addEventListener('DOMContentLoaded', function() {
    var descInput = document.getElementById('project_dependencies_desc-input');
    if (descInput) {
        descInput.onkeydown = function (event) {
            if (event.key === 'Enter') {
                addData(event);
            }
        };
    }
});
