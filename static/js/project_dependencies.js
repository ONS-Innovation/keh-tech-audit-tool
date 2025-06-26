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
