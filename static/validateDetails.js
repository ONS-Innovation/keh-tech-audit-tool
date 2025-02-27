/**
 * Tech Audit Tool - Validation Details
 * Handles the validation details page functionality
 */

// ===== INITIALIZATION =====

/**
 * Initialize the validation details page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Reset error panel at the start
    clearErrors();
    
    // Set up edit mode if applicable
    setupEditMode();
    
    // Load all data 
    loadData();
    
    // Set validation flags
    localStorage.setItem("source_control-validate", true);
    localStorage.setItem("hosting-validate", true);
});

/**
 * Main function to initialize the page and load all data
 */
function initializePage() {
    // Initialize error tracking
    initializeErrorList();
    
    // Check and set up edit mode if needed
    initializeEditMode();
    
    try {
        // Process all sections and get final data
        const finalData = processAllSections();
        
        // Update the summary display with processed data
        updateSummaryDisplay(finalData);
        
        // Update hidden fields for form submission
        updateHiddenFields(finalData);
        
        // Check if there are any errors
        if (window.errorList && window.errorList.length > 0) {
            displayErrors();
        }
        
        // Enable the form submit button if everything is valid
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            // Only enable if we have at least project name
            if (finalData.details && finalData.details.project_name) {
                submitBtn.disabled = false;
            } else {
                submitBtn.disabled = true;
            }
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        window.errorList.push(`Error initializing page: ${error.message}`);
        displayErrors();
    }
}

// Initialize the page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializePage);

// ===== ERROR HANDLING =====

/**
 * Displays an error message in the error panel
 * @param {string} message - The error message to display
 */
function displayError(message) {
    const errorPanel = document.getElementById('error-panel');
    // Show the error panel
    errorPanel.style.display = 'block';
    
    // Find or create the error message container
    let errorContainer = errorPanel.querySelector('.error-messages');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-messages';
        // Add after the label but before any existing content
        const label = errorPanel.querySelector('label');
        if (label) {
            label.insertAdjacentElement('afterend', errorContainer);
        } else {
            errorPanel.appendChild(errorContainer);
        }
    }
    
    // Add the new error message
    errorContainer.innerHTML += `<ul><li>${message}</li></ul>`;
    document.getElementById('submitBtn').style.display = 'none';
}

/**
 * Clears all error messages from the error panel
 */
function clearErrors() {
    const errorPanel = document.getElementById('error-panel');
    // Hide the panel
    errorPanel.style.display = 'none';
    // Clear only the error messages, not the header or label
    const errorContainer = errorPanel.querySelector('.error-messages');
    if (errorContainer) {
        errorContainer.innerHTML = '';
    }
    document.getElementById('submitBtn').style.display = 'block';
}

// ===== DATA LOADING =====

/**
 * Sets up edit mode if the page is loaded for editing
 */
function setupEditMode() {
    // Check if we're in edit mode
    const editMode = JSON.parse(localStorage.getItem('edit') || 'false');
    
    if (editMode) {
        try {
            // Get project data from template
            const projectDataStr = document.getElementById('project_data_template')?.value;
            if (projectDataStr) {
                const projectData = JSON.parse(projectDataStr.replace(/'/g, '"'));
                
                // Convert API format to UI format
                const uiData = apiToUi(projectData);
                
                if (uiData) {
                    // Store in localStorage with -edit suffix
                    Object.entries(uiData).forEach(([key, value]) => {
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            // Handle nested objects like architecture, supporting_tools
                            Object.entries(value).forEach(([subKey, subValue]) => {
                                localStorage.setItem(`${subKey}-data-edit`, subValue);
                            });
                        } else {
                            localStorage.setItem(`${key}-data-edit`, value);
                        }
                    });
                    
                    // Set the project name for the form submission
                    const projectName = document.getElementById('project_name_template')?.value;
                    if (projectName) {
                        document.getElementById('project_name').value = projectName;
                    }
                }
            }
        } catch (error) {
            console.error('Error setting up edit mode:', error);
            window.errorList.push('Error loading project data for editing');
        }
    }
}

/**
 * Gets project data from the edit mode template
 * @returns {Object|null} The project data or null
 */
function getProjectData() {
    try {
        const projectDataElement = document.getElementById('project_data_template');
        if (!projectDataElement || !projectDataElement.value) return null;
        
        // Parse project data from template (convert single quotes to double quotes)
        const projectDataStr = projectDataElement.value.replace(/'/g, '"');
        return JSON.parse(projectDataStr);
    } catch (error) {
        console.error('Error getting project data:', error);
        return null;
    }
}

/**
 * Initializes edit mode based on URL
 */
function initializeEditMode() {
    // Check if we're in edit mode based on URL
    const currentUrl = window.location.href;
    const isEditMode = currentUrl.endsWith('/edit');
    
    // Store edit mode status in localStorage
    localStorage.setItem('edit', isEditMode);
    
    // If in edit mode, set up project data
    if (isEditMode) {
        setupEditMode();
    }
}

/**
 * Main function to load and validate all data
 */
function loadData() {
    // Get field names based on edit mode
    const fields = getFieldNames();
    
    // Load all data from localStorage
    const storedData = loadStoredData();
    
    // Process contacts
    const youData = processContacts(storedData.contactTech, storedData.contactManager);
    
    // Process all other sections
    const processedData = processAllSections(storedData);
    
    // Additional validation for hosting
    validateHosting(processedData.hosting);
    
    // Create the final data structure
    const finalData = createFinalDataStructure(youData, processedData, storedData);
    
    // Update the UI with the processed data
    updateSummaryDisplay(finalData);
    
    // Update hidden form fields
    updateHiddenFields(finalData);
}

/**
 * Returns the field names for localStorage keys
 * @returns {Object} Object containing field mapping with key names
 */
function getFieldNames() {
    // Check if we're in edit mode
    const isEditMode = JSON.parse(localStorage.getItem('edit') || 'false');
    const suffix = isEditMode ? '-edit' : '';
    
    // Return mapping of field names to localStorage keys
    return {
        contactTech: `contact_tech-data${suffix}`,
        contactManager: `contact_manager-data${suffix}`,
        project: `project-data${suffix}`,
        developed: `developed-data${suffix}`,
        stage: `stage-data${suffix}`,
        sourceControl: `source_control-data${suffix}`,
        hosting: `hosting-data${suffix}`,
        database: `database-data${suffix}`,
        languages: `languages-data${suffix}`,
        frameworks: `frameworks-data${suffix}`,
        integrations: `integrations-data${suffix}`,
        infrastructure: `infrastructure-data${suffix}`, 
        codeEditors: `code_editors-data${suffix}`,
        userInterface: `user_interface-data${suffix}`,
        diagrams: `diagrams-data${suffix}`,
        projectTracking: `project_tracking-data${suffix}`,
        documentation: `documentation-data${suffix}`,
        communication: `communication-data${suffix}`,
        collaboration: `collaboration-data${suffix}`,
        incidentManagement: `incident_management-data${suffix}`
    };
}

/**
 * Loads all stored data from localStorage
 * @returns {Object} Object containing all loaded data
 */
function loadStoredData() {
    const fields = getFieldNames();
    const storedData = {};
    
    // Load each field from localStorage
    Object.entries(fields).forEach(([key, localStorageKey]) => {
        const data = localStorage.getItem(localStorageKey);
        if (data && data !== 'null' && data !== 'undefined') {
            try {
                storedData[key] = JSON.parse(data);
            } catch (e) {
                console.log(`Error parsing ${key} data:`, e);
                storedData[key] = null;
            }
        } else {
            storedData[key] = null;
        }
    });
    
    return storedData;
}

// ===== DATA PROCESSING =====

/**
 * Processes contact data from technical contact and manager data
 * @param {string} techData - Technical contact JSON string
 * @param {string} managerData - Manager contact JSON string
 * @returns {Array} Array of processed contact objects
 */
function processContacts(techData, managerData) {
    const youData = [];
    
    // Process Technical Contact
    const techContact = validateData(techData, 'Technical Contact', ['contactEmail', 'role']);
    if (techContact) {
        youData.push({
            email: techContact.contactEmail,
            roles: ["Technical Contact"],
            grade: techContact.role
        });
    } else {
        youData.push({ email: "", roles: [""], grade: "" });
    }

    // Process Delivery Manager
    const managerContact = validateData(managerData, 'Delivery Manager', ['contactEmail', 'role']);
    if (managerContact) {
        youData.push({
            email: managerContact.contactEmail,
            roles: ["Delivery Manager"],
            grade: managerContact.role
        });
    } else {
        youData.push({ email: "", roles: [""], grade: "" });
    }

    return youData;
}

/**
 * Initializes error list for tracking validation issues
 */
function initializeErrorList() {
    // Create global error list
    window.errorList = [];
    window.allErrorList = []; // Keep track of all errors for debugging
    
    // Clear any existing error panel
    const errorPanel = document.getElementById('error-panel');
    if (errorPanel) {
        errorPanel.style.display = 'none';
        const errorList = document.getElementById('error-list');
        if (errorList) errorList.innerHTML = '';
    }
}

/**
 * Displays error list in the UI if there are any errors
 * Only shows Project section errors since other sections are not required
 */
function displayErrors() {
    if (!window.errorList || window.errorList.length === 0) return;
    
    const errorPanel = document.getElementById('error-panel');
    const errorList = document.getElementById('error-list');
    
    if (!errorPanel || !errorList) return;
    
    // Clear existing errors
    errorList.innerHTML = '';
    
    // Filter to only show Project section errors
    const projectErrors = window.errorList.filter(error => 
        error.includes('Project section') || 
        error.includes('project_name') || 
        error.includes('project_short_name') || 
        error.includes('doc_link') ||
        error.includes('Project Name') ||
        error.includes('Project Short Name') ||
        error.includes('Documentation Link')
    );
    
    // Add each Project error as a list item
    if (projectErrors.length > 0) {
        projectErrors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });
        
        // Show the error panel
        errorPanel.style.display = 'block';
    } else {
        // Hide the panel if no Project errors
        errorPanel.style.display = 'none';
    }
}

/**
 * Process all sections of data from localStorage
 * @returns {Object} Processed data object with all validated sections
 */
function processAllSections() {
    // Initialize error tracking
    initializeErrorList();
    
    try {
        // Load all stored data
        const storedData = loadStoredData();
        
        // Process each section
        const processedData = {
            // Process user information (Technical Contact and Delivery Manager)
            user: processTechnicalContact(storedData.contactTech),
            
            // Process stage information
            stage: processStage(storedData.stage),
            
            // Process project details
            details: processProject(storedData.project),
            
            // Process development information
            developed: processDeveloped(storedData.developed),
            
            // Process architecture information
            architecture: {
                source_control: processSourceControl(storedData.sourceControl),
                hosting: processHosting(storedData.hosting),
                database: processDatabases(storedData.database),
                languages: processLanguages(storedData.languages),
                frameworks: processFrameworks(storedData.frameworks),
                integrations: processIntegrations(storedData.integrations),
                infrastructure: processInfrastructure(storedData.infrastructure)
            },
            
            // Process supporting tools information
            supporting_tools: {
                code_editors: processCodeEditors(storedData.codeEditors),
                user_interface: processUI(storedData.userInterface),
                diagrams: processDiagrams(storedData.diagrams),
                project_tracking: processTracking(storedData.projectTracking),
                documentation: processDocumentation(storedData.documentation),
                communication: processCommunication(storedData.communication),
                collaboration: processCollaboration(storedData.collaboration),
                incident_management: processIncidentManagement(storedData.incidentManagement)
            }
        };
        
        // Display any collected errors
        displayErrors();
        
        return processedData;
    } catch (error) {
        console.error('Error processing sections:', error);
        window.errorList.push(`Error processing data: ${error.message}`);
        displayErrors();
        return {};
    }
}

/**
 * Process project data
 * @param {Object} data - Project data
 * @returns {Object} Processed project data
 */
function processProject(data) {
    try {
        return validateData(data, 'Project', 
            ['project_name', 'project_short_name', 'doc_link'], 
            ['programme_name', 'programme_short_name', 'project_description']);
    } catch (error) {
        console.error('Error processing project data:', error);
        window.errorList.push('Error processing project data: ' + error.message);
        return {};
    }
}

/**
 * Creates the final data structure for submission
 * @param {Array} youData - Array of processed contact objects
 * @param {Object} processedData - Object containing all processed data
 * @param {Object} storedData - Object containing all stored data
 * @returns {Object} Final data structure for submission
 */
function createFinalDataStructure(youData, processedData, storedData) {
    return {
        user: youData,
        details: processedData.project,
        developed: processedData.developed,
        source_control: [{
            type: JSON.parse(storedData.sourceControl)?.source_control || '',
            links: JSON.parse(storedData.sourceControl)?.links || []
        }],
        architecture: {
            frameworks: processedData.frameworks || { main: [], others: [] },
            infrastructure: processedData.infrastructure || { main: [], others: [] },
            integrations: processedData.integrations || { main: [], others: [] },
            languages: processedData.languages || { main: [], others: [] },
            hosting: JSON.parse(storedData.hosting) || { type: '', others: [] },
            database: processedData.database || { main: [], others: [] },
        },
        stage: processedData.stage?.stage || '',
        supporting_tools: {
            code_editors: processedData.codeEditors || { main: [], others: [] },
            user_interface: processedData.userInterface || { main: [], others: [] },
            diagrams: processedData.diagrams || { main: [], others: [] },
            project_tracking: processedData.projectTracking?.project_tracking || '',
            documentation: processedData.documentation || { main: [], others: [] },
            communication: processedData.communication || { main: [], others: [] },
            collaboration: processedData.collaboration || { main: [], others: [] },
            incident_management: processedData.incidentManagement?.incident_management || ''
        }
    };
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Mapping of technical field names to user-friendly labels
 * Used for displaying readable error messages to users
 */
const fieldLabels = {
    // Project fields
    "project_name": "Project Name",
    "project_short_name": "Project Short Name",
    "programme_name": "Programme Name",
    "programme_short_name": "Programme Short Name",
    "project_description": "Project Description",
    "doc_link": "Documentation Link",
    
    // Contact fields
    "contactEmail": "Email Address",
    "role": "Role",
    
    // Developed fields
    "developed": "Development Type",
    "outsource_company": "Outsource Company",
    "partnership_company": "Partnership Company",
    
    // Source Control fields
    "source_control": "Source Control",
    
    // Other fields commonly used
    "type": "Type",
    "main": "Main Selection",
    "others": "Other Selections",
    "stage": "Project Stage"
};

/**
 * Validates data against required and optional fields
 * @param {Object} data - Data object to validate
 * @param {string} sectionName - Name of the section being validated
 * @param {Array} requiredFields - Array of field names that are required
 * @param {Array} optionalFields - Array of field names that are optional
 * @returns {Object|null} The valid data object or null if validation failed
 */
function validateData(data, sectionName, requiredFields, optionalFields = []) {
    if (!data) {
        console.log(`${sectionName} section data is missing`);
        // Only add to error list if it's the Project section
        // Store all errors in allErrorList for debugging, but only Project errors in the main errorList
        window.allErrorList.push(`${sectionName} section data is missing`);
        if (sectionName === 'Project') {
            window.errorList.push(`${sectionName} section data is missing`);
        }
        return null;
    }
    
    // Special handling for Project section - collect errors but allow partial data
    if (sectionName === 'Project') {
        if (!data || Object.keys(data).length === 0) {
            console.log(`${sectionName} section data is empty`);
            window.errorList.push(`${sectionName} section data is empty`);
            return {};
        }
        
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field] === '') {
                missingFields.push(field);
            }
        }
        
        if (missingFields.length > 0) {
            // Convert technical field names to user-friendly labels
            const missingFieldsLabels = missingFields.map(field => 
                fieldLabels[field] || field // Use friendly label if available, otherwise use the field name
            );
            
            const missingFieldsList = missingFieldsLabels.join(', ');
            console.log(`${sectionName} section is missing required fields: ${missingFieldsList}`);
            window.errorList.push(`${sectionName} section is missing required fields: ${missingFieldsList}`);
            
            // Mark the missing fields in the data for UI highlighting
            missingFields.forEach(field => {
                data[`${field}_missing`] = true;
            });
        }
        
        return data;
    }
    
    // For other sections, check required fields normally but don't add to visible error list
    const missingFields = [];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field] === '') {
            missingFields.push(field);
        }
    }
    
    if (missingFields.length > 0) {
        // Convert technical field names to user-friendly labels
        const missingFieldsLabels = missingFields.map(field => 
            fieldLabels[field] || field // Use friendly label if available, otherwise use the field name
        );
        
        const missingFieldsList = missingFieldsLabels.join(', ');
        console.log(`${sectionName} section is missing required fields: ${missingFieldsList}`);
        
        // Add to allErrorList for debugging but not to the main errorList that's displayed
        window.allErrorList.push(`${sectionName} section is missing required fields: ${missingFieldsList}`);
        
        return null;
    }
    
    return data;
}

/**
 * Performs additional validation on hosting data
 * @param {Object} hostingData - Hosting data object
 */
function validateHosting(hostingData) {
    if (hostingData) {
        if ((hostingData.type === "Cloud" || hostingData.type === "Hybrid") 
            && (!hostingData.others || hostingData.others.length === 0)) {
            displayError("'Hosting' section is incomplete");
        }
    }
}

/**
 * Processes technical contact data
 * @param {Object} data - Technical contact data
 * @returns {Array} Array of processed contact objects
 */
function processTechnicalContact(data) {
    try {
        if (!data) return [];
        return [validateData(data, 'Technical Contact', ['contactEmail', 'role'])];
    } catch (error) {
        console.error('Error processing technical contacts:', error);
        window.errorList.push('Error processing technical contacts: ' + error.message);
        return [];
    }
}

/**
 * Processes stage data
 * @param {Object} data - Stage data
 * @returns {string} Stage information or empty string
 */
function processStage(data) {
    try {
        return validateData(data, 'Stage', ['stage']);
    } catch (error) {
        console.error('Error processing stage data:', error);
        window.errorList.push('Error processing stage data: ' + error.message);
        return null;
    }
}

/**
 * Processes development information
 * @param {Object} data - Development data
 * @returns {Object|null} Processed development data or null
 */
function processDeveloped(data) {
    try {
        return validateData(data, 'Developed', ['developed']);
    } catch (error) {
        console.error('Error processing development data:', error);
        window.errorList.push('Error processing development data: ' + error.message);
        return null;
    }
}

/**
 * Processes source control data
 * @param {Object} data - Source control data
 * @returns {Object|null} Processed source control data or null
 */
function processSourceControl(data) {
    try {
        return validateData(data, 'Source Control', ['source_control']);
    } catch (error) {
        console.error('Error processing source control data:', error);
        window.errorList.push('Error processing source control data: ' + error.message);
        return null;
    }
}

/**
 * Processes hosting data
 * @param {Object} data - Hosting data
 * @returns {Object|null} Processed hosting data or null
 */
function processHosting(data) {
    try {
        return validateData(data, 'Hosting', ['type']);
    } catch (error) {
        console.error('Error processing hosting data:', error);
        window.errorList.push('Error processing hosting data: ' + error.message);
        return null;
    }
}

/**
 * Processes database data
 * @param {string} data - JSON string with database data
 * @returns {Object|null} Processed database data or null
 */
function processDatabases(data) {
    try {
        return validateData(data, 'Databases');
    } catch (error) {
        console.error('Error processing database data:', error);
        window.errorList.push('Error processing database data: ' + error.message);
        return null;
    }
}

/**
 * Processes languages data
 * @param {string} data - JSON string with languages data
 * @returns {Object|null} Processed languages data or null
 */
function processLanguages(data) {
    try {
        return validateData(data, 'Languages');
    } catch (error) {
        console.error('Error processing languages data:', error);
        window.errorList.push('Error processing languages data: ' + error.message);
        return null;
    }
}

/**
 * Processes frameworks data
 * @param {string} data - JSON string with frameworks data
 * @returns {Object|null} Processed frameworks data or null
 */
function processFrameworks(data) {
    try {
        return validateData(data, 'Frameworks');
    } catch (error) {
        console.error('Error processing frameworks data:', error);
        window.errorList.push('Error processing frameworks data: ' + error.message);
        return null;
    }
}

/**
 * Processes integration data
 * @param {string} data - JSON string with integration data
 * @returns {Object|null} Processed integration data or null
 */
function processIntegrations(data) {
    try {
        return validateData(data, 'Integrations');
    } catch (error) {
        console.error('Error processing integration data:', error);
        window.errorList.push('Error processing integration data: ' + error.message);
        return null;
    }
}

/**
 * Processes infrastructure data
 * @param {string} data - JSON string with infrastructure data
 * @returns {Object|null} Processed infrastructure data or null
 */
function processInfrastructure(data) {
    try {
        return validateData(data, 'Infrastructure');
    } catch (error) {
        console.error('Error processing infrastructure data:', error);
        window.errorList.push('Error processing infrastructure data: ' + error.message);
        return null;
    }
}

/**
 * Processes code editors data
 * @param {string} data - JSON string with code editors data
 * @returns {Object|null} Processed code editors data or null
 */
function processCodeEditors(data) {
    try {
        return validateData(data, 'Code Editors');
    } catch (error) {
        console.error('Error processing code editors data:', error);
        window.errorList.push('Error processing code editors data: ' + error.message);
        return null;
    }
}

/**
 * Processes UI data
 * @param {string} data - JSON string with UI data
 * @returns {Object|null} Processed UI data or null
 */
function processUI(data) {
    try {
        return validateData(data, 'User Interface');
    } catch (error) {
        console.error('Error processing UI data:', error);
        window.errorList.push('Error processing UI data: ' + error.message);
        return null;
    }
}

/**
 * Processes diagrams data
 * @param {string} data - JSON string with diagrams data
 * @returns {Object|null} Processed diagrams data or null
 */
function processDiagrams(data) {
    try {
        return validateData(data, 'Diagrams');
    } catch (error) {
        console.error('Error processing diagrams data:', error);
        window.errorList.push('Error processing diagrams data: ' + error.message);
        return null;
    }
}

/**
 * Processes project tracking data
 * @param {string} data - JSON string with project tracking data
 * @returns {string} Processed project tracking data or empty string
 */
function processTracking(data) {
    try {
        const trackingData = validateData(data, 'Project Tracking');
        return trackingData?.tracking || '';
    } catch (error) {
        console.error('Error processing project tracking data:', error);
        window.errorList.push('Error processing project tracking data: ' + error.message);
        return '';
    }
}

/**
 * Processes documentation data
 * @param {string} data - JSON string with documentation data
 * @returns {Object|null} Processed documentation data or null
 */
function processDocumentation(data) {
    try {
        return validateData(data, 'Documentation');
    } catch (error) {
        console.error('Error processing documentation data:', error);
        window.errorList.push('Error processing documentation data: ' + error.message);
        return null;
    }
}

/**
 * Processes communication data
 * @param {string} data - JSON string with communication data
 * @returns {Object|null} Processed communication data or null
 */
function processCommunication(data) {
    try {
        return validateData(data, 'Communication');
    } catch (error) {
        console.error('Error processing communication data:', error);
        window.errorList.push('Error processing communication data: ' + error.message);
        return null;
    }
}

/**
 * Processes collaboration data
 * @param {string} data - JSON string with collaboration data
 * @returns {Object|null} Processed collaboration data or null
 */
function processCollaboration(data) {
    try {
        return validateData(data, 'Collaboration');
    } catch (error) {
        console.error('Error processing collaboration data:', error);
        window.errorList.push('Error processing collaboration data: ' + error.message);
        return null;
    }
}

/**
 * Processes incident management data
 * @param {string} data - JSON string with incident management data
 * @returns {string} Processed incident management data or empty string
 */
function processIncidentManagement(data) {
    try {
        const incidentData = validateData(data, 'Incident Management');
        return incidentData?.incident_management || '';
    } catch (error) {
        console.error('Error processing incident management data:', error);
        window.errorList.push('Error processing incident management data: ' + error.message);
        return '';
    }
}

/**
 * Converts an array to an HTML list
 * @param {Array} arr - Array of items
 * @returns {string} HTML list string
 */
function arrToList(arr) {
    if (!arr || arr.length === 0) return '';
    return `<ul>${arr.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} Safe string with escaped HTML
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== UI UPDATE =====

/**
 * Updates all summary elements in the UI
 * @param {Object} finalData - The final processed data structure
 */
function updateSummaryDisplay(finalData) {
    // Guard against null or undefined finalData
    if (!finalData) finalData = {};
    if (!finalData.user) finalData.user = [];
    if (!finalData.architecture) finalData.architecture = {};
    if (!finalData.supporting_tools) finalData.supporting_tools = {};
    
    // Ensure architecture properties exist
    const architecture = finalData.architecture;
    if (!architecture.database) architecture.database = { main: [], others: [] };
    if (!architecture.languages) architecture.languages = { main: [], others: [] };
    if (!architecture.frameworks) architecture.frameworks = { main: [], others: [] };
    if (!architecture.integrations) architecture.integrations = { main: [], others: [] };
    if (!architecture.infrastructure) architecture.infrastructure = { main: [], others: [] };
    
    // Ensure supporting_tools properties exist
    const supportingTools = finalData.supporting_tools;
    if (!supportingTools.code_editors) supportingTools.code_editors = { main: [], others: [] };
    if (!supportingTools.user_interface) supportingTools.user_interface = { main: [], others: [] };
    if (!supportingTools.diagrams) supportingTools.diagrams = { main: [], others: [] };
    if (!supportingTools.documentation) supportingTools.documentation = { main: [], others: [] };
    if (!supportingTools.communication) supportingTools.communication = { main: [], others: [] };
    if (!supportingTools.collaboration) supportingTools.collaboration = { main: [], others: [] };
    
    // Create a mapping of all summary fields
    const summaryData = {
        technical_contact: finalData.user[0]?.email ? 
            `${finalData.user[0].email} (${finalData.user[0].grade})` : '',
        delivery_manager: finalData.user[1]?.email ? 
            `${finalData.user[1].email} (${finalData.user[1].grade})` : '',
        stage_details: finalData.stage?.stage ? 
            `<ul><li>Stage: ${finalData.stage.stage}</li></ul>` : '',
        project_details: generateProjectDetails(finalData.details),
        developed_details: finalData.developed?.developed ? 
            `<ul>
                <li>Developed By: ${finalData.developed.developed}</li>
                <li>Partnership/Outsource Company: ${finalData.developed.partnership_company || 
                    finalData.developed.outsource_company || 'N/A'}</li>
            </ul>` : '',
        source_control_details: generateSourceControlDetails(finalData.architecture.source_control),
        hosting_details: generateHostingDetails(finalData.architecture.hosting),
        database_details: arrToList(getMainAndOthers(finalData.architecture.database)),
        languages_details: arrToList(getMainAndOthers(finalData.architecture.languages)),
        framework_details: arrToList(getMainAndOthers(finalData.architecture.frameworks)),
        integration_details: arrToList(getMainAndOthers(finalData.architecture.integrations)),
        infrastructure_details: arrToList(getMainAndOthers(finalData.architecture.infrastructure)),
        code_editor_details: arrToList(getMainAndOthers(finalData.supporting_tools.code_editors)),
        user_interface_details: arrToList(getMainAndOthers(finalData.supporting_tools.user_interface)),
        diagram_details: arrToList(getMainAndOthers(finalData.supporting_tools.diagrams)),
        project_tracking_details: finalData.supporting_tools.project_tracking || '',
        documentation_details: arrToList(getMainAndOthers(finalData.supporting_tools.documentation)),
        communication_details: arrToList(getMainAndOthers(finalData.supporting_tools.communication)),
        collaboration_details: arrToList(getMainAndOthers(finalData.supporting_tools.collaboration)),
        incident_management_details: finalData.supporting_tools.incident_management || ''
    };

    // Update all summary elements
    Object.entries(summaryData).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) element.innerHTML = value || '';
    });
}

/**
 * Helper function to safely combine main and others arrays
 * @param {Object} data - Data object with main and others arrays
 * @returns {Array} Combined array of main and others
 */
function getMainAndOthers(data) {
    if (!data) return [];
    
    const main = Array.isArray(data.main) ? data.main : [];
    const others = Array.isArray(data.others) ? data.others : [];
    
    return main.concat(others);
}

/**
 * Generates HTML for source control details
 * @param {Object} data - Source control data
 * @returns {string} HTML for source control details
 */
function generateSourceControlDetails(data) {
    if (!data) return '';
    
    let html = '<ul>';
    
    if (data.source_control) {
        html += `<li>Type: ${escapeHtml(data.source_control)}</li>`;
    }
    
    if (data.links && Array.isArray(data.links) && data.links.length > 0) {
        html += '<li>Links:<ul>';
        
        data.links.forEach(link => {
            if (link.url) {
                html += `<li><a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.description || link.url)}</a></li>`;
            }
        });
        
        html += '</ul></li>';
    }
    
    html += '</ul>';
    
    return html;
}

/**
 * Generates HTML for hosting details
 * @param {Object} data - Hosting data
 * @returns {string} HTML for hosting details
 */
function generateHostingDetails(data) {
    if (!data) return '';
    
    let html = '<ul>';
    
    if (data.type) {
        html += `<li>Type: ${escapeHtml(data.type)}</li>`;
    }
    
    if (data.others && Array.isArray(data.others) && data.others.length > 0) {
        html += '<li>Details:<ul>';
        
        data.others.forEach(detail => {
            html += `<li>${escapeHtml(detail)}</li>`;
        });
        
        html += '</ul></li>';
    }
    
    html += '</ul>';
    
    return html;
}

/**
 * Generates HTML for project details with clear indication of missing fields
 * @param {Object} details - Project details object
 * @returns {string} HTML string with project details
 */
function generateProjectDetails(details) {
    if (!details) return '';
    
    let html = '<ul>';
    
    // Project name - required
    if (details.project_name && details.project_name !== "") {
        html += `<li>Name: ${escapeHtml(details.project_name)}</li>`;
    } else {
        html += '<li class="missing-field">Name: <span class="required-field">Required</span></li>';
    }
    
    // Project short name - required
    if (details.project_short_name && details.project_short_name !== "") {
        html += `<li>Short Name: ${escapeHtml(details.project_short_name)}</li>`;
    } else {
        html += '<li class="missing-field">Short Name: <span class="required-field">Required</span></li>';
    }
    
    // Programme name - optional
    if (details.programme_name && details.programme_name !== "") {
        html += `<li>Programme Name: ${escapeHtml(details.programme_name)}</li>`;
    }
    
    // Programme short name - optional
    if (details.programme_short_name && details.programme_short_name !== "") {
        html += `<li>Programme Short Name: ${escapeHtml(details.programme_short_name)}</li>`;
    }
    
    // Documentation link - required
    if (details.doc_link && details.doc_link !== "") {
        html += `<li>Documentation Link: ${escapeHtml(details.doc_link)}</li>`;
    } else {
        html += '<li class="missing-field">Documentation Link: <span class="required-field">Required</span></li>';
    }
    
    // Project description - optional
    if (details.project_description && details.project_description !== "") {
        html += `<li>Description: ${escapeHtml(details.project_description)}</li>`;
    }
    
    html += '</ul>';
    
    // Add some minimal inline styles for the missing fields
    html += `
    <style>
    .missing-field {
        color: #d4351c;
    }
    .required-field {
        font-weight: bold;
    }
    </style>`;
    
    return html;
}

/**
 * Updates all hidden form fields for submission
 * @param {Object} finalData - The final processed data structure
 */
function updateHiddenFields(finalData) {
    // Guard against null or undefined finalData
    if (!finalData) finalData = {};
    if (!finalData.user) finalData.user = [];
    if (!finalData.architecture) finalData.architecture = {};
    if (!finalData.supporting_tools) finalData.supporting_tools = {};
    
    // Ensure architecture properties exist
    const architecture = finalData.architecture;
    if (!architecture.hosting) architecture.hosting = {};
    if (!architecture.database) architecture.database = {};
    if (!architecture.languages) architecture.languages = {};
    if (!architecture.frameworks) architecture.frameworks = {};
    if (!architecture.integrations) architecture.integrations = {};
    if (!architecture.infrastructure) architecture.infrastructure = {};
    
    // Ensure supporting_tools properties exist
    const supportingTools = finalData.supporting_tools;
    if (!supportingTools.code_editors) supportingTools.code_editors = {};
    if (!supportingTools.user_interface) supportingTools.user_interface = {};
    if (!supportingTools.diagrams) supportingTools.diagrams = {};
    if (!supportingTools.documentation) supportingTools.documentation = {};
    if (!supportingTools.communication) supportingTools.communication = {};
    if (!supportingTools.collaboration) supportingTools.collaboration = {};

    const hiddenFields = {
        user: finalData.user || [],
        project: finalData.details || {},
        developed: finalData.developed || {},
        source_control: finalData.source_control || [],
        hosting: {
            type: architecture.hosting.type ? [architecture.hosting.type] : [],
            details: architecture.hosting.others || []
        },
        database: architecture.database || { main: [], others: [] },
        languages: architecture.languages || { main: [], others: [] },
        frameworks: architecture.frameworks || { main: [], others: [] },
        integrations: architecture.integrations || { main: [], others: [] },
        infrastructure: architecture.infrastructure || { main: [], others: [] },
        stage: finalData.stage || '',
        code_editors: supportingTools.code_editors || { main: [], others: [] },
        user_interface: supportingTools.user_interface || { main: [], others: [] },
        diagrams: supportingTools.diagrams || { main: [], others: [] },
        project_tracking: supportingTools.project_tracking || '',
        documentation: supportingTools.documentation || { main: [], others: [] },
        communication: supportingTools.communication || { main: [], others: [] },
        collaboration: supportingTools.collaboration || { main: [], others: [] },
        incident_management: supportingTools.incident_management || ''
    };

    // Add project_name for edit mode
    if (JSON.parse(localStorage.getItem('edit') || 'false')) {
        const projectName = document.getElementById('project_name_template')?.value || '';
        if (projectName) {
            hiddenFields.project_name = projectName;
        }
    }

    // Update all hidden input fields
    Object.entries(hiddenFields).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            try {
                element.value = JSON.stringify(value);
            } catch (error) {
                console.error(`Error setting value for ${key}:`, error);
                element.value = '{}';
            }
        }
    });
}

// ===== API DATA CONVERSION =====

/**
 * Converts API data structure to UI data structure
 * @param {Object} apiData - Data in API format
 * @returns {Object} Data in UI format
 */
function apiToUi(apiData) {
    try {
        return {
            technicalContact: JSON.stringify([
                { email: apiData.user[0].email, role: apiData.user[0].grade }
            ]),
            contact_manager: JSON.stringify([
                { email: apiData.user[1].email, role: apiData.user[1].grade }
            ]),
            project: JSON.stringify({
                project_name: apiData.details[0].name,
                project_short_name: apiData.details[0].short_name,
                programme_name: apiData.details[0].programme_name || "",
                programme_short_name: apiData.details[0].programme_short_name || "",
                doc_link: apiData.details[0].documentation_link[0],
                project_description: apiData.details[0].project_description
            }),
            source_control: JSON.stringify([
                { type: apiData.source_control[0].type, links: apiData.source_control[0].links }
            ]),
            hosting: JSON.stringify({
                type: apiData.architecture.hosting.type[0],
                main: [],
                others: apiData.architecture.hosting.details
            }),
            stage: JSON.stringify({ stage: apiData.stage }),
            developed: JSON.stringify({
                developed: apiData.developed[0],
                outsource_company: apiData.developed[1][0] || null,
                partnership_company: apiData.developed[1][1] || null
            }),
            architecture: {
                frameworks: JSON.stringify(apiData.architecture.frameworks || { main: [], others: [] }),
                languages: JSON.stringify(apiData.architecture.languages || { main: [], others: [] }),
                database: JSON.stringify(apiData.architecture.database || { main: [], others: [] }),
                integrations: JSON.stringify(apiData.architecture.integrations || { main: [], others: [] }),
                infrastructure: JSON.stringify(apiData.architecture.infrastructure || { main: [], others: [] })
            },
            supporting_tools: {
                code_editors: JSON.stringify(apiData.supporting_tools.code_editors || { main: [], others: [] }),
                user_interface: JSON.stringify(apiData.supporting_tools.user_interface || { main: [], others: [] }),
                diagrams: JSON.stringify(apiData.supporting_tools.diagrams || { main: [], others: [] }),
                project_tracking: JSON.stringify(apiData.supporting_tools.project_tracking || ''),
                documentation: JSON.stringify(apiData.supporting_tools.documentation || { main: [], others: [] }),
                communication: JSON.stringify(apiData.supporting_tools.communication || { main: [], others: [] }),
                collaboration: JSON.stringify(apiData.supporting_tools.collaboration || { main: [], others: [] }),
                incident_management: JSON.stringify(apiData.supporting_tools.incident_management || '')
            }
        };
    } catch (error) {
        console.error('Error converting API data to UI format:', error);
        return null;
    }
}

/**
 * Function to remove edits from localStorage when submitting the form
 * Used in edit mode when form is submitted
 */
function removeEdits() {
    // Define base fields
    const baseFields = [
        'contact_tech-data', 'contact_manager-data', 'project-data', 
        'developed-data', 'stage-data', 'source_control-data', 
        'hosting-data', 'database-data', 'frameworks-data', 
        'infrastructure-data', 'integrations-data', 'languages-data', 
        'code_editors-data', 'user_interface-data', 'diagrams-data', 
        'project_tracking-data', 'documentation-data', 'communication-data', 
        'collaboration-data', 'incident_management-data'
    ];
    
    // Remove edit suffix from all fields
    baseFields.forEach(field => {
        localStorage.removeItem(`${field}-edit`);
    });
} 