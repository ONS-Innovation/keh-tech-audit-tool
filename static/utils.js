function removeEdits() {
    localStorage.setItem("edit", false);
    var fields = ['contact_tech-data-edit', 'contact_manager-data-edit', 'project-data-edit', 'developed-data-edit', 'stage-data-edit', 
                'source_control-data-edit', 'hosting-data-edit', 'database-data-edit', 'frameworks-data-edit', 'infrastructure-data-edit', 'integrations-data-edit', 
                'languages-data-edit', 'code_editors-data-edit', 'user_interface-data-edit', 'diagrams-data-edit', 'project_tracking-data-edit', 'documentation-data-edit', 
                'communication-data-edit', 'collaboration-data-edit', 'incident_management-data-edit'];
    localStorage.removeItem("redirect_url");
    for (let i = 0; i < fields.length; i++) {
        var field = fields[i];
        localStorage.removeItem(field);
    }
}

function removeValidate() {
    localStorage.removeItem("hosting-validate");
    localStorage.removeItem("source_control-validate");
}
