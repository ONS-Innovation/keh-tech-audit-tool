const roleIdMap = {
    "Grade 6": "grade-6",
    "Grade 7": "grade-7",
    "SEO": "seo",
    "HEO": "heo"
};

const idRoleMap = Object.fromEntries(
    Object.entries(roleIdMap).map(([k, v]) => [v, k])
);

const stageIdMap = {
    "Development": "development",
    "Active Support": "active-support",
    "Unsupported": "unsupported"
};

const idStageMap = Object.fromEntries(
    Object.entries(stageIdMap).map(([k, v]) => [v, k])
);

// Store contact data in local storage
function storeContactData(keyBase) {
    const contactEmail = document.getElementById('contact-email')?.value;
    const selectedId = document.querySelector('input[name="role"]:checked')?.id;

    let role;
    if (selectedId === 'other') {
        role = document.getElementById('other-input').value;
    } else {
        role = idRoleMap[selectedId] || selectedId;
    }

    let complete = false;
    if (contactEmail != '' && role != '') {
        complete = true;
    }

    const data = {
        contactEmail,
        role,
        complete
    };

    const isEdit = JSON.parse(localStorage.getItem('edit'));
    const key = isEdit ? `${keyBase}-edit` : keyBase;

    localStorage.setItem(key, JSON.stringify(data));
}

// Load contact data from local storage
function loadContactData(keyBase) {
    const isEdit = JSON.parse(localStorage.getItem('edit'));
    const key = isEdit ? `${keyBase}-edit` : keyBase;

    const data = JSON.parse(localStorage.getItem(key));
    if (!data) return;

    document.getElementById('contact-email').value = data.contactEmail;

    const roleId = roleIdMap[data.role];
    if (roleId && document.getElementById(roleId)) {
        document.getElementById(roleId).checked = true;
    } else {
        document.getElementById("other").checked = true;
        document.getElementById('other-input').value = data.role;
    }
}

// Store stage data in local storage
function storeStageData() {
    const selectedId = document.querySelector('input[name="stage"]:checked')?.id;
    const stage = idStageMap[selectedId] || selectedId;

    const data = {
        stage,
        complete: true
    };

    const isEdit = JSON.parse(localStorage.getItem('edit'));
    const key = isEdit ? 'stage-data-edit' : 'stage-data';

    localStorage.setItem(key, JSON.stringify(data));
}

// Load stage data from local storage
function loadStageData() {
    const isEdit = JSON.parse(localStorage.getItem('edit'));
    const key = isEdit ? 'stage-data-edit' : 'stage-data';

    const data = JSON.parse(localStorage.getItem(key));
    if (!data) return;

    const stageId = stageIdMap[data.stage];
    if (stageId && document.getElementById(stageId)) {
        document.getElementById(stageId).checked = true;
    }
}

// Redirect to previous page
function redirectToPrevious(){
    var url = new URL(document.referrer).pathname;
    var trail = url.split("/")[url.split('/').length - 1];

    const regex = /\/survey\/(.+?)\/edit/;
    if (url === '/validate_details'
        || url === '/survey/project_summary' 
        || url === '/survey/tech_summary' 
        || url === '/survey/architecture_summary'
        || url === '/survey/supporting_tools_summary'
        || trail === "edit") {
        document.getElementById('save-values-button').href = new URL(document.referrer);
    }
}

// Convert array to unordered html list
function arrToList(arr) {
    var final = ""
    try {
        for (let i = 0; i <= arr.length - 1; i++) {
            if (i === 0) {
                final += `<ul>`
            }
            final += `<li>${
                arr[i]
            }</li>`;
            if (i === arr.length - 1) {
                final += `</ul>`
            }
        }
    } catch (e) {
        console.log(e);
    }
    return final;
}

// Convert array of objects to unordered html list with hrefs
function arrToLinkList(arr) {
    var final = ""
    try {
        for (let i = 0; i <= arr.length - 1; i++) {
            if (i === 0) {
                final += `<ul>`
            }
            final += `<li>${
                arr[i].description
            }: <br> <a href='${
                arr[i].url
            }'>${
                arr[i].url
            }</a></li>`;
            if (i === arr.length - 1) {
                final += `</ul>`
            }
        }
    } catch (e) {
        console.log(e);
    }
    return final;
}


function updateSectionStatus(sectionId, dataItems) { // Update selection status to indicate how far complete a section is e.g Not started, Partially completed, Completed
    var sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        var completedCount = dataItems.filter(item => {
            if (item) {
                var parsedItem = JSON.parse(item);
                if (Array.isArray(parsedItem)) {
                    return parsedItem.length > 0;
                } else if (typeof parsedItem === 'object') {
                    if (parsedItem.complete === true) {
                        return true;
                    } else if (parsedItem.type === 'On-premises') {
                        return true;
                    }
                    else if (parsedItem.main || parsedItem.others) {
                        return(parsedItem.main && parsedItem.main.length > 0) || (parsedItem.others && parsedItem.others.length > 0);
                    }
                }
            }
            return false;
        }).length;
        var totalCount = dataItems.length;
        var actionSpan = sectionElement.querySelector('.ons-summary__values span');
        var actionSpan2 = sectionElement.querySelector('.ons-summary__actions span');
        var dtSpan = sectionElement.querySelector('dt span');
        if (completedCount === 0) {
            actionSpan.innerHTML = 'Not Started';
            actionSpan2.textContent = 'Start section';
        } else if (completedCount < totalCount) {
            actionSpan.innerHTML = 'Partially completed';
            actionSpan2.textContent = 'Continue with section';
            if (dtSpan) {
                dtSpan.innerHTML = '<span class="ons-summary__item-title-icon ons-summary__item-title-icon--check"><svg class="ons-icon" viewBox="0 0 13 10"' +
                        ' xmlns="http://www.w3.org/2000/svg" focusable="false" fill="currentColor"> <path d="M14.35,3.9l-.71-.71a.5.5,0,0,0-.71,0' +
                        'h0L5.79,10.34,3.07,7.61a.51.51,0,0,0-.71,0l-.71.71a.51.51,0,0,0,0,.71l3.78,3.78a.5.5,0,0,0,.71,0h0L14.35,4.6A.5.5,0,0,0,' +
                        '14.35,3.9Z" transform="translate(-1.51 -3.04)"></path> </svg></span>';
            }
        } else {
            actionSpan.innerHTML = 'Completed';
            actionSpan2.textContent = 'Change section';
            if (dtSpan) {
                dtSpan.innerHTML = '<span class="ons-summary__item-title-icon ons-summary__item-title-icon--check"><svg class="ons-icon" viewBox="0 0 13 10"' +
                        ' xmlns="http://www.w3.org/2000/svg" focusable="false" fill="currentColor"> <path d="M14.35,3.9l-.71-.71a.5.5,0,0,0-.71,0' +
                        'h0L5.79,10.34,3.07,7.61a.51.51,0,0,0-.71,0l-.71.71a.51.51,0,0,0,0,.71l3.78,3.78a.5.5,0,0,0,.71,0h0L14.35,4.6A.5.5,0,0,0,' +
                        '14.35,3.9Z" transform="translate(-1.51 -3.04)"></path> </svg></span>';
            }
        }
    }
}

function changeBtnText() {
    document.getElementById('primary-submit-btn-text').innerHTML = 'Fill in missing details';
}

function displayIncomplete(section) {
    return `<ul><li>'${section}' section is incomplete</li></ul>`
}

function removeSecondBtn() {
    var submissionBtn = document.getElementById('secondary-submit-btn');
    if (submissionBtn) {
        submissionBtn.style.display = 'none';
    }
}

function validateDataAndRedirect(data, url, submitBtn, validationFn) {
    try {
        const parsedData = JSON.parse(data);
        if (!validationFn(parsedData)) {
            submitBtn.href = url;
            changeBtnText();
            return true; // Validation failed, needs redirection
        }
        return false;
    } catch (e) {
        console.log(e);
        document.getElementById('primary-submit-btn-text').innerHTML = 'Fill in missing details';
        submitBtn.href = url;
        return true;
    }
}

function validateArrayLength(data) {
    return data.length > 0;
}

function validateObjectField(data, field) {
    return data[field] && data[field].length > 0;
}

function validateMultipleFields(data, fields) {
    if (!data) return false;          // <<< guard in case data is null/undefined
    return fields.every(field => {
      const val = data[field];
      // you can also enforce non-empty strings/arrays here:
      return val !== undefined && val !== null && val !== '';
    });
  }

function validateEnvironmentsData(data) {
    if (!data.complete) return false;
    return data.complete
}

function changeBtnURL(contactTechData, contactManagerData, projectData, projectDependenciesData, 
    sourceControlData, databaseData, environmentsData, languagesData, 
    frameworksData, integrationsData, infrastructureData, publishingData,
    codeEditorsData, uiToolsData, diagramToolsData, 
    projectTrackingData, documentationData, communicationData, 
    collaborationData, incidentManagementData, miscellaneousData) {
    // Dynamically change url of submit button based on the completion status of each section
    var submissionBtn = document.getElementById('secondary-submit-btn');
    var submissionBtnSpan = submissionBtn.querySelector('span');
    if (submissionBtnSpan) {
        submissionBtnSpan.style.display = 'flex';
        submissionBtnSpan.querySelector('svg').style.marginTop = '4px';
    }

    var submitBtn = document.getElementById('primary-submit-btn');
    var submitBtnSpan = submitBtn.querySelector('span');
    if (submitBtnSpan) {
        submitBtnSpan.style.display = 'flex';
        submitBtnSpan.querySelector('svg').style.marginTop = '4px';
    }
    // Define all validation checks with their URLs and validation functions
    const validations = [
        // Project Details
        { 
            data: contactTechData, 
            url: '/survey/contact_tech', 
            validationFn: (data) => validateMultipleFields(data, ['contactEmail', 'role'])
        },
        { 
            data: contactManagerData, 
            url: '/survey/contact_manager', 
            validationFn: (data) => validateMultipleFields(data, ['contactEmail', 'role'])
        },
        { 
            data: projectData, 
            url: '/survey/project', 
            validationFn: (data) => validateMultipleFields(data, ['name', 'short_name', 'project_description', 'documentation_link', 'programme_name', 'programme_short_name'])
        },
        // TODO: Developed + Stage missing validation
        { 
            data: projectDependenciesData, 
            url: '/survey/project_dependencies', 
            validationFn: (data) => Array.isArray(data) && data.length > 0
        },
        // Code and Architecture
        { 
            data: sourceControlData, 
            url: '/survey/source_control', 
            validationFn: (data) => validateObjectField(data, 'source_control')
        },
        // TODO: Hosting missing validation
        { 
            data: databaseData, 
            url: '/survey/database', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: environmentsData, 
            url: '/survey/environments', 
            validationFn: (data) => validateEnvironmentsData(data)
        },
        // Technology
        { 
            data: languagesData, 
            url: '/survey/languages', 
            validationFn: (data) => (data.main && data.main.length > 0) || (data.others && data.others.length > 0)
        },
        { 
            data: frameworksData, 
            url: '/survey/frameworks', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: integrationsData, 
            url: '/survey/integrations', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: infrastructureData, 
            url: '/survey/infrastructure', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: publishingData, 
            url: '/survey/publishing', 
            validationFn: (data) => (data.main && data.main.length > 0) || (data.others && data.others.length > 0)
        },
        // Supporting Tools
        { 
            data: codeEditorsData, 
            url: '/survey/code_editors', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: projectTrackingData, 
            url: '/survey/project_tracking', 
            validationFn: (data) => data.project_tracking !== undefined && data.project_tracking !== ""
        },
        { 
            data: uiToolsData, 
            url: '/survey/user_interface', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: diagramToolsData, 
            url: '/survey/diagrams', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: documentationData, 
            url: '/survey/documentation', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: communicationData, 
            url: '/survey/communication', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: collaborationData, 
            url: '/survey/collaboration', 
            validationFn: (data) => data.others && data.others.length > 0
        },
        { 
            data: incidentManagementData, 
            url: '/survey/incident_management', 
            validationFn: (data) => data.incident_management !== undefined && data.incident_management !== ""
        },
        {
            data: miscellaneousData,
            url: '/survey/miscellaneous',
            validationFn: (data) => Array.isArray(data) && data.length > 0
        }
    ];
    
    // Run through all validations
    for (const validation of validations) {
        if (validateDataAndRedirect(validation.data, validation.url, submitBtn, validation.validationFn)) {
            return; // Stop if any validation fails
        }
    }
    
    // If we reach here, all validations have passed
    removeSecondBtn(); // Remove the second button
    document.getElementById('primary-submit-btn-text').innerHTML = 'Continue to submission'; // Change button text
}

function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(match) {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escapeMap[match];
        });
    }
    

