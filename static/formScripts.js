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
        var sectionIdWithDash = sectionId.replace(/_/g, '-');
        var sectionElementWithDash = document.getElementById(sectionIdWithDash);
        var actionSpan = sectionElementWithDash.querySelectorAll('dd span')[1];
        if (completedCount === 0) {
            sectionElement.innerHTML = 'Not Started';
            if (actionSpan) {
                actionSpan.innerHTML = 'Start section';
            }
        } else if (completedCount < totalCount) {
            sectionElement.innerHTML = 'Partially completed';
            if (actionSpan) {
                actionSpan.innerHTML = 'Continue with section';
            }
        } else {
            sectionElement.innerHTML = 'Completed';
            if (actionSpan) {
                actionSpan.textContent = 'Change section';
            }
            var span = sectionElementWithDash.querySelector('dt span');
            if (span) {
                span.innerHTML = '<span class="ons-summary__item-title-icon ons-summary__item-title-icon--check"><svg class="ons-icon" viewBox="0 0 13 10"' +
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
    return fields.every(field => data[field]);
}

function changeBtnURL(contactTechData, contactManagerData, projectData, 
    sourceControlData, databaseData, languagesData, 
    frameworksData, integrationsData, infrastructureData, 
    codeEditorsData, uiToolsData, diagramToolsData, 
    projectTrackingData, documentationData, communicationData, 
    collaborationData, incidentManagementData) {
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
            validationFn: (data) => validateMultipleFields(data, ['project_name', 'project_short_name', 'project_description', 'doc_link'])
        },
        { 
            data: sourceControlData, 
            url: '/survey/source_control', 
            validationFn: (data) => validateObjectField(data, 'source_control')
        },
        { 
            data: databaseData, 
            url: '/survey/database', 
            validationFn: (data) => data.others && data.others.length > 0
        },
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
    

