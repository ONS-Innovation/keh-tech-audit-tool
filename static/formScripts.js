// Redirect to previous page
function redirectToPrevious(){
    var url = new URL(document.referrer).pathname;
    if (url === '/validate_details' 
        || url === '/survey/project_summary' 
        || url === '/survey/tech_summary' 
        || url === '/survey/architecture_summary'
        || url === '/survey/supporting_tools_summary') {
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
    // Chnage text of submit button to 'Continue' if the section is not completed
    document.getElementById('submit-btn-text').innerHTML = 'Continue';
}

function displayIncomplete(section) {
    return `<ul><li>'${section}' section is incomplete</li></ul>`
}

function changeBtnURL(contactTechData, contactManagerData, projectData, sourceControlData, databaseData, languagesData, frameworksData, integrationsData, infrastructureData) {
    // Dynamically change url of submit button based on the completion status of each section
    var submitBtn = document.getElementById('submit-btn');
        var submitBtnSpan = submitBtn.querySelector('span');
        if (submitBtnSpan) {
            submitBtnSpan.style.display = 'flex';
            submitBtnSpan.querySelector('svg').style.marginTop = '2px';

        }
        try {
            if (!JSON.parse(contactTechData)["contactEmail"] || !JSON.parse(contactTechData)["role"]) {
                submitBtn.href = '/survey/contact_tech';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/pre-survey/project';
            console.log(e)

            return;
        }
        try {
            if (!JSON.parse(contactManagerData)["contactEmail"] || !JSON.parse(contactManagerData)["role"]) {
                submitBtn.href = '/survey/contact_manager';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/survey/contact-manager';
            console.log(e)
            return;
        }
        try {
            if (
                !JSON.parse(projectData)["project_name"] ||
                !JSON.parse(projectData)["project_short_name"] ||
                !JSON.parse(projectData)["project_description"] ||
                !JSON.parse(projectData)["doc_link"]
            ) {
                submitBtn.href = '/survey/project';
                console.log("hello");
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/survey/project';
            console.log(e);
            return;
        }
        try {
            if (!JSON.parse(sourceControlData)["source_control"]) {
                submitBtn.href = '/survey/source_control';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/pre-survey/architecture';
            console.log(e)
            return;
        }
        try {
            if (!JSON.parse(databaseData)["others"].length === 0) {
                submitBtn.href = '/survey/database';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/survey/database';
            console.log(e);
            return;
        }
        try {
            if (!JSON.parse(languagesData)["others"].length === 0) {
                submitBtn.href = '/survey/languages';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/pre-survey/technology';
            console.log(e);
            return;
        }
        try {
            if (!JSON.parse(frameworksData)["others"].length === 0) {
                submitBtn.href = '/survey/frameworks';
                changeBtnText()
                return;
            }
        } catch (e) {
            changeBtnText()
            submitBtn.href = '/survey/frameworks';
            console.log(e)
            return;
        }
        try {
            if (!JSON.parse(integrationsData)["others"].length === 0) {
                submitBtn.href = '/survey/integrations';
                changeBtnText()
                return;
            }
        } catch (e) {
            document.getElementById('submit-btn-text').innerHTML = 'Continue'
            submitBtn.href = '/survey/integrations';
            console.log(e);
            return;
        }
        try {
            if (!JSON.parse(infrastructureData)["others"].length === 0) {
                submitBtn.href = '/survey/infrastructure';
                changeBtnText()
                return;
            }
        } catch (e) {
            changeBtnText()
            submitBtn.href = '/survey/infrastructure';
            console.log(e);
            return;
        }
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
    

