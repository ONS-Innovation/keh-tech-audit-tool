function formatList(items) {
    if (!items || items.length === 0) return 'N/A';
    return items.join(', ');
}

function loadData(projects) {
    try {
    // Technical Contact
    document.getElementById('technical_contact_row').querySelector('dd').querySelector('span').textContent = 
            `${projects.user[0].email} (${projects.user[0].grade})`;
    } catch (e) {
        // No error
    }
    try {
        // Delivery Manager
        document.getElementById('delivery_manager_row').querySelector('dd').querySelector('span').textContent = 
            `${projects.user[1].email} (${projects.user[1].grade})`;
    } catch (e) {
        // No error
    }

    let projectDetails = '';
    if (projects.details[0].programme_name) {
        projectDetails += `Programme Name: <p style="font-weight:400">${projects.details[0].programme_name}</p>`
    }
    if (projects.details[0].programme_short_name) {
        projectDetails += `Programme Short Name: <p style="font-weight:400">${projects.details[0].programme_short_name}</p>`
    }
    if (projects.details[0].name) {
        projectDetails += `Project Name: <p style="font-weight:400">${projects.details[0].name}</p>`
    }
    if (projects.details[0].short_name) {
        projectDetails += `Short Name: <p style="font-weight:400">${projects.details[0].short_name}</p>`
    }
    if (projects.details[0].documentation_link !== '') {
        projectDetails += `Documentation Link: <p style="font-weight:400">${projects.details[0].documentation_link}</p>`
    }
    if (projects.details[0].project_description) {
        projectDetails += `Project Description: <p style="font-weight:400">${projects.details[0].project_description}</p>`
    }
    
    // Project Details
    document.getElementById('project_details_row').querySelector('dd').querySelector('span').innerHTML = 
        projectDetails;

    // Developed
    if (projects.developed[0] == 'In House') {
        document.getElementById('developed_row').querySelector('dd').querySelector('span').textContent = 
            `${projects.developed[0]}`;
    } else if (projects.developed[0] != 'In House' && projects.developed[1]) {
        // Handle both string and array formats for company name
        let companyName = projects.developed[1];
        if (Array.isArray(projects.developed[1]) && projects.developed[1][0]) {
            companyName = projects.developed[1][0];
        }
        
        document.getElementById('developed_row').querySelector('dd').querySelector('span').innerHTML = 
            `Developed: <p style="font-weight:400">${projects.developed[0]}</p>Company:<p style="font-weight:400">${companyName}</p>`;
    } else {
        document.getElementById('developed_row').querySelector('dd').querySelector('span').textContent = 
            'N/A';
    }
    
    // Source Control
    if (projects.source_control[0].type) {
        let sourceControlHtml = `${projects.source_control[0].type}`;
        
        // Add all links, not just the first one
        if (projects.source_control[0].links && projects.source_control[0].links.length > 0) {
            projects.source_control[0].links.forEach(link => {
                if (link.description && link.url) {
                    sourceControlHtml += `<br>${link.description}: <a href="${link.url}" target="_blank">${link.url}</a>`;
                }
            });
        }
        
        document.getElementById('source_control_row').querySelector('dd').querySelector('span').innerHTML = sourceControlHtml;
    } else {
        document.getElementById('source_control_row').querySelector('dd').querySelector('span').textContent = 
            'N/A';
    }

    // Stage
    document.getElementById('stage_row').querySelector('dd').querySelector('span').textContent = 
        projects.stage || 'N/A';

    // Project Dependencies
    const dependencies = projects.project_dependencies;
    const dependenciesContainer = document.getElementById('project_dependencies_row')
        .querySelector('dd')
        .querySelector('span');
    if (Array.isArray(dependencies) && dependencies.length > 0) {
        dependenciesContainer.innerHTML = dependencies
            .map(item => `<p>${item.name}: <span style="font-weight: 400;">${item.description}</span></p>`)
            .join('');
    } else {
        dependenciesContainer.textContent = 'N/A';
    }

    // Hosting
    let hostingType = projects.architecture.hosting.type && projects.architecture.hosting.type[0] ? projects.architecture.hosting.type[0] : '';
    let hostingProviders = Array.isArray(projects.architecture.hosting.details) && projects.architecture.hosting.details.length > 0 ? formatList(projects.architecture.hosting.details) : '';
    let hostingDisplay = '';
    
    if (hostingType === 'On-premises') {
        hostingDisplay = 'On-premises';
    } else if (hostingType && hostingProviders) {
        hostingDisplay = `${hostingType}: ${hostingProviders}`;
    } else if (hostingType) {
        hostingDisplay = hostingType;
    } else if (hostingProviders) {
        hostingDisplay = `Cloud: ${hostingProviders}`;
    } else {
        hostingDisplay = 'N/A';
    }
    document.getElementById('hosting_row').querySelector('dd').querySelector('span').textContent = hostingDisplay;

    // Database
    document.getElementById('database_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.architecture.database.others);

    // Frameworks
    document.getElementById('frameworks_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.architecture.frameworks.others);

    // Languages
    const mainLangs = projects.architecture.languages.main.join(', ');
    const otherLangs = projects.architecture.languages.others.join(', ');
    let languagesText = '';
    if (mainLangs && otherLangs) {
        languagesText = `${mainLangs}, ${otherLangs}`;
    } else if (mainLangs) {
        languagesText = mainLangs;
    } else if (otherLangs) {
        languagesText = otherLangs;
    } else {
        languagesText = 'N/A';
    }
    document.getElementById('languages_row').querySelector('dd').querySelector('span').textContent = languagesText;

    // CI/CD
    document.getElementById('cicd_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.architecture.cicd.others);

    // Infrastructure
    document.getElementById('infrastructure_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.architecture.infrastructure.others);

    // Code Editors
    document.getElementById('code_editors_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.code_editors.others);

    // User Interface
    document.getElementById('user_interface_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.user_interface.others);

    // Diagrams
    document.getElementById('diagrams_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.diagrams.others);

    // Project Tracking
    document.getElementById('project_tracking_row').querySelector('dd').querySelector('span').textContent = 
        projects.supporting_tools.project_tracking || 'N/A';

    // Documentation
    document.getElementById('documentation_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.documentation.others);

    // Communication
    document.getElementById('communication_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.communication.others);

    // Collaboration
    document.getElementById('collaboration_row').querySelector('dd').querySelector('span').textContent = 
        formatList(projects.supporting_tools.collaboration.others);

    // Incident Management
    document.getElementById('incident_management_row').querySelector('dd').querySelector('span').textContent = 
        projects.supporting_tools.incident_management || 'N/A';

    // Miscellaneous
const misc = projects.supporting_tools.miscellaneous;
const miscContainer = document.getElementById('miscellaneous_row')
    .querySelector('dd')
    .querySelector('span');
if (Array.isArray(misc) && misc.length > 0) {
    miscContainer.innerHTML = misc
        .map(item => `<p>${item.name}: <span style="font-weight: 400;">${item.description}</span></p>`)
        .join('');
} else {
    miscContainer.textContent = 'N/A';
}
}