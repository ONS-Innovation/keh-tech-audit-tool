/**
 * Tech Audit Tool - Form Scripts
 * Utility functions for form management, validation, and display
 */

// ===== STATUS MANAGEMENT =====

/**
 * Updates the visual status of a form section based on completion status
 * @param {string} sectionId - ID of the section element to update
 * @param {Array} dataItems - Array of data items to check for completion
 */
function updateSectionStatus(sectionId, dataItems) {
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) return;

    // Count completed items
    const completedCount = countCompletedItems(dataItems);
    
    // Count items that have been viewed but are empty
    const viewedButEmptyCount = countViewedButEmptyItems(dataItems);
    
    const totalCount = dataItems.length;
    const sectionIdWithDash = sectionId.replace(/_/g, '-');
    const sectionElementWithDash = document.getElementById(sectionIdWithDash);
    const actionSpan = sectionElementWithDash?.querySelectorAll('dd span')[1];
    
    updateSectionDisplay(
        sectionElement, 
        actionSpan, 
        sectionElementWithDash, 
        completedCount, 
        viewedButEmptyCount, 
        totalCount
    );
}

/**
 * Counts items that are considered "completed" in a data array
 * @param {Array} dataItems - Array of data items to check
 * @returns {number} Count of completed items
 */
function countCompletedItems(dataItems) {
    return dataItems.filter(item => {
        console.log(item);
        if (!item) return false;
        
        const parsedItem = JSON.parse(item);
        
        // Handle array items
        if (Array.isArray(parsedItem)) {
            return parsedItem.length > 0;
        } 
        
        // Handle object items
        if (typeof parsedItem === 'object') {
            // Check for completion flag
            if (parsedItem.complete === true) {
                return true;
            }
            
            // Check for specific types
            if (parsedItem.type === 'On-premises') {
                return true;
            }
            
            // Check for array properties
            if (parsedItem.main || parsedItem.others) {
                return (parsedItem.main && parsedItem.main.length > 0) || 
                       (parsedItem.others && parsedItem.others.length > 0);
            }
        }
        
        return false;
    }).length;
}

/**
 * Counts items that have been viewed but contain no data
 * @param {Array} dataItems - Array of data items to check
 * @returns {number} Count of viewed but empty items
 */
function countViewedButEmptyItems(dataItems) {
    return dataItems.filter(item => {
        if (!item) return false;
        
        const parsedItem = JSON.parse(item);
        
        // Check for objects with empty arrays
        if (typeof parsedItem === 'object' && !parsedItem.complete) {
            if ((parsedItem.main && parsedItem.main.length === 0) || 
                (parsedItem.others && parsedItem.others.length === 0)) {
                        return true;
                    }
            
            // Check for empty arrays
            if (Array.isArray(parsedItem) && parsedItem.length === 0) {
                            return true;
                        }
                    }
        
            return false;
        }).length;
}

/**
 * Updates the display of a section based on its completion status
 * @param {HTMLElement} sectionElement - The main section element
 * @param {HTMLElement} actionSpan - The action span element
 * @param {HTMLElement} sectionElementWithDash - The section element with dash
 * @param {number} completedCount - Count of completed items
 * @param {number} viewedButEmptyCount - Count of viewed but empty items
 * @param {number} totalCount - Total count of items
 */
function updateSectionDisplay(
    sectionElement, 
    actionSpan, 
    sectionElementWithDash, 
    completedCount, 
    viewedButEmptyCount, 
    totalCount
) {
    console.log(viewedButEmptyCount, totalCount)

    // Not started at all
    if (completedCount === 0 && viewedButEmptyCount === 0) {
            sectionElement.innerHTML = 'Not Started';
            if (actionSpan) {
                actionSpan.innerHTML = 'Start section';
            }
    } 
    // Viewed but no data entered
    else if (viewedButEmptyCount > 0) {
        sectionElement.innerHTML = 'Viewed but not completed';
        if (actionSpan) {
            actionSpan.innerHTML = 'Continue with section';
        }
        updateSVGSpan(sectionElementWithDash);
    } 
    // Some data entered but not complete
    else if (completedCount < totalCount) {
            sectionElement.innerHTML = 'Partially completed';
            if (actionSpan) {
                actionSpan.innerHTML = 'Continue with section';
            }
    } 
    // All sections completed
    else {
            sectionElement.innerHTML = 'Completed';
            if (actionSpan) {
                actionSpan.textContent = 'Change section';
            }
        updateSVGSpan(sectionElementWithDash);
    }
}

/**
 * Updates the SVG checkmark icon for a completed section
 * @param {HTMLElement} sectionElementWithDash - The section element to update
 * @returns {HTMLElement|null} The updated span element or null
 */
function updateSVGSpan(sectionElementWithDash) {
    const span = sectionElementWithDash.querySelector('dt span');
    if (span) {
        span.innerHTML = '<span class="ons-summary__item-title-icon ons-summary__item-title-icon--check" style="marginTop: -2px;"><svg class="ons-icon" viewBox="0 0 13 10"' +
                ' xmlns="http://www.w3.org/2000/svg" focusable="false" fill="currentColor">' +
                '<path d="M14.35,3.9l-.71-.71a.5.5,0,0,0-.71,0h0L5.79,10.34,3.07,7.61a.51.51,0,0,0-.71,0l-.71.71a.51.51,0,0,0,0,.71l3.78,3.78a.5.5,0,0,0,.71,0h0L14.35,4.6A.5.5,0,0,0,14.35,3.9Z" transform="translate(-1.51 -3.04)"></path>' +
                '</svg></span>';
    } else {
        console.log('No span found');
    }
    return span;
}

// ===== FORM UTILITIES =====

/**
 * Changes the text of the submit button
 * @param {string} text - The text to display on the button
 */
function changeBtnText(text = 'Continue') {
    const buttonTextElement = document.getElementById('submit-btn-text');
    if (buttonTextElement) {
        buttonTextElement.innerHTML = text;
    }
}

/**
 * Creates an HTML list item for incomplete section
 * @param {string} section - The name of the incomplete section
 * @returns {string} HTML string for the incomplete section
 */
function displayIncomplete(section) {
    return `<ul><li>'${section}' section is incomplete</li></ul>`;
}

/**
 * Updates a button's URL and text
 * @param {string} url - The URL to set for the button
 * @param {string} buttonText - Text to display on the button
 */
function updateButton(url, buttonText = 'Continue') {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.href = url;
        const textElement = document.getElementById('submit-btn-text');
        if (textElement) {
            textElement.innerHTML = buttonText;
        }
    }
}

// ===== VALIDATION =====

/**
 * Helper function to check if a field is required and redirect if missing
 * @param {string} data - The JSON string to parse
 * @param {string} url - The URL to redirect to if validation fails
 * @param {Function} validationFn - Function that returns true if validation passes
 * @param {string} buttonText - Text to display on the button
 * @returns {boolean} - True if validation passed, false if it failed
 */
function validateField(data, url, validationFn, buttonText = 'Fill in missing information') {
    try {
        const parsedData = JSON.parse(data);
        if (!validationFn(parsedData)) {
            updateButton(url, buttonText);
            return false;
        }
        return true;
        } catch (e) {
            console.log(e);
        updateButton(url, buttonText);
        return false;
    }
}

/**
 * Main validation function for all form sections
 * Controls the redirect flow based on validation results
 * @param {...string} allData - All form data parameters
 */
function changeBtnURL(
    contactTechData, 
    contactManagerData, 
    projectData, 
    sourceControlData, 
    databaseData, 
    languagesData, 
    frameworksData, 
    integrationsData, 
    infrastructureData, 
    codeEditorsData, 
    uiToolsData, 
    diagramToolsData, 
    projectTrackingData, 
    documentationData, 
    communicationData, 
    collaborationData, 
    incidentManagementData
) {
    // Set up button styling
    setupButtonStyles();
    
    // Validate each section in sequence
    // Contact information
    if (!validateContactSection(contactTechData, contactManagerData)) return;
    
    // Project information
    if (!validateProjectSection(projectData, sourceControlData)) return;
    
    // Architecture
    if (!validateArchitectureSection(
        databaseData, languagesData, frameworksData, 
        integrationsData, infrastructureData
    )) return;
    
    // Supporting tools
    if (!validateSupportingToolsSection(
        codeEditorsData, uiToolsData, diagramToolsData, projectTrackingData,
        documentationData, communicationData, collaborationData, incidentManagementData
    )) return;
}

/**
 * Sets up button styles for the validation process
 */
function setupButtonStyles() {
    // Main submit button
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnSpan = submitBtn?.querySelector('span');
    
    if (submitBtnSpan) {
        submitBtnSpan.style.display = 'flex';
        submitBtnSpan.style.alignItems = 'center';
        const svg = submitBtnSpan.querySelector('svg');
        if (svg) {
            svg.style.marginTop = '2px';
        }
    }

    // Validation button if present
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) {
        const validateBtnSpan = validateBtn.querySelector('span');
        
        if (validateBtnSpan) {
            validateBtnSpan.style.display = 'flex';
            validateBtnSpan.style.alignItems = 'center';
            const svg = validateBtnSpan.querySelector('svg');
            if (svg) {
                svg.style.marginTop = '2px';
            }
        }
    }
}

/**
 * Validates contact information section
 * @param {string} contactTechData - Technical contact data
 * @param {string} contactManagerData - Manager contact data
 * @returns {boolean} True if validation passed, false otherwise
 */
function validateContactSection(contactTechData, contactManagerData) {
    // Contact Tech validation
    if (!validateField(
        contactTechData, 
        '/survey/contact_tech', 
        data => data.contactEmail && data.role
    )) return false;
    
    // Contact Manager validation
    if (!validateField(
        contactManagerData, 
        '/survey/contact_manager', 
        data => data.contactEmail && data.role
    )) return false;
    
    return true;
}

/**
 * Validates project information section
 * @param {string} projectData - Project details data
 * @param {string} sourceControlData - Source control data 
 * @returns {boolean} True if validation passed, false otherwise
 */
function validateProjectSection(projectData, sourceControlData) {
    // Project validation
    if (!validateField(
        projectData, 
        '/survey/project', 
        data => data.project_name && data.project_short_name && 
               data.project_description && data.doc_link
    )) return false;
    
    // Source Control validation
    if (!validateField(
        sourceControlData, 
        '/survey/source_control', 
        data => data.source_control
    )) return false;
    
    return true;
}

/**
 * Validates architecture section
 * @param {string} databaseData - Database data
 * @param {string} languagesData - Languages data
 * @param {string} frameworksData - Frameworks data
 * @param {string} integrationsData - Integrations data
 * @param {string} infrastructureData - Infrastructure data
 * @returns {boolean} True if validation passed, false otherwise
 */
function validateArchitectureSection(
    databaseData, 
    languagesData, 
    frameworksData, 
    integrationsData, 
    infrastructureData
) {
    // Database validation
    if (!validateField(
        databaseData, 
        '/survey/database', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Languages validation
    if (!validateField(
        languagesData, 
        '/survey/languages', 
        data => !(data.others.length === 0),
        'Continue'
    )) return false;
    
    // Frameworks validation
    if (!validateField(
        frameworksData, 
        '/survey/frameworks', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Integrations validation
    if (!validateField(
        integrationsData, 
        '/survey/integrations', 
        data => !(data.others.length === 0),
        'Fill in missing information'
    )) return false;
    
    // Infrastructure validation
    if (!validateField(
        infrastructureData, 
        '/survey/infrastructure', 
        data => !(data.others.length === 0)
    )) return false;
    
    return true;
}

/**
 * Validates supporting tools section
 * @param {string} codeEditorsData - Code editors data
 * @param {string} uiToolsData - UI tools data
 * @param {string} diagramToolsData - Diagram tools data
 * @param {string} projectTrackingData - Project tracking data
 * @param {string} documentationData - Documentation data
 * @param {string} communicationData - Communication data
 * @param {string} collaborationData - Collaboration data
 * @param {string} incidentManagementData - Incident management data
 * @returns {boolean} True if validation passed, false otherwise
 */
function validateSupportingToolsSection(
    codeEditorsData,
    uiToolsData,
    diagramToolsData,
    projectTrackingData,
    documentationData,
    communicationData,
    collaborationData,
    incidentManagementData
) {
    // Code Editors validation
    if (!validateField(
        codeEditorsData, 
        '/survey/code_editors', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Project Tracking validation
    if (!validateField(
        projectTrackingData, 
        '/survey/project_tracking', 
        data => data.length !== 0
    )) return false;
    
    // UI Tools validation
    if (!validateField(
        uiToolsData, 
        '/survey/user_interface', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Diagram Tools validation
    if (!validateField(
        diagramToolsData, 
        '/survey/diagrams', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Documentation validation
    if (!validateField(
        documentationData, 
        '/survey/documentation', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Communication validation
    if (!validateField(
        communicationData, 
        '/survey/communication', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Collaboration validation
    if (!validateField(
        collaborationData, 
        '/survey/collaboration', 
        data => !(data.others.length === 0)
    )) return false;
    
    // Incident Management validation
    if (!validateField(
        incidentManagementData, 
        '/survey/incident_management', 
        data => data.length !== 0
    )) return false;
    
    return true;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Escapes HTML special characters in a string
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    
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
    
/**
 * Converts an array to an HTML unordered list
 * @param {Array} arr - The array to convert
 * @returns {string} HTML string for the unordered list
 */
function arrToList(arr) {
    if (!arr || arr.length === 0) return '';
    
    let final = '<ul>';
    for (let i = 0; i < arr.length; i++) {
        final += `<li>${escapeHtml(arr[i])}</li>`;
    }
    final += '</ul>';
    
    return final;
}

/**
 * Converts an array of objects with URLs to an HTML unordered list with links
 * @param {Array} arr - The array of objects to convert
 * @returns {string} HTML string for the unordered list with links
 */
function arrToLinkList(arr) {
    if (!arr || arr.length === 0) return '';
    
    let final = '<ul>';
    for (let i = 0; i < arr.length; i++) {
        final += `<li>${escapeHtml(arr[i].description)}: <br>` +
                `<a href='${escapeHtml(arr[i].url)}'>${escapeHtml(arr[i].url)}</a></li>`;
    }
    final += '</ul>';
    
    return final;
}

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


