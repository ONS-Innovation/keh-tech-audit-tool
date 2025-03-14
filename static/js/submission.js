// Utility class for common operations
const DataUtils = {
    // Convert array to comma-separated list
    arrToList: function(arr) {
        if (!arr || arr.length === 0) return '';
        return arr.filter(item => item && item !== "").join(', ');
    },
    
    // Safely parse JSON with fallback
    safeJsonParse: function(jsonString, fallback = {}) {
        try {
            return jsonString ? JSON.parse(jsonString) : fallback;
        } catch (e) {
            console.error("JSON parse error:", e);
            return fallback;
        }
    },
    
    // Safely get values with default fallbacks
    safeGet: function(obj, path, defaultValue = '') {
        if (!obj) return defaultValue;
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current[part] === undefined || current[part] === null) {
                return defaultValue;
            }
            current = current[part];
        }
        
        return current;
    },
    
    // Combine main and other arrays
    combineArrays: function(obj, property) {
        if (!obj) return [];
        const main = obj[property]?.main || [];
        const others = obj[property]?.others || [];
        return [...main, ...others].filter(item => item && item !== "");
    }
};

// Error handling class
const ErrorHandler = {
    // Display an error message
    displayError: function(message) {
        const errorPanel = document.getElementById('error-panel');
        errorPanel.style.display = 'block';
        
        let errorContainer = errorPanel.querySelector('.error-messages');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'error-messages';
            const label = errorPanel.querySelector('label');
            if (label) {
                label.insertAdjacentElement('afterend', errorContainer);
            } else {
                errorPanel.appendChild(errorContainer);
            }
        }
        
        errorContainer.innerHTML += `<ul><li>${message}</li></ul>`;
        document.getElementById('submit-button').style.display = 'none';
    },
    
    // Clear all errors
    clearErrors: function() {
        const errorPanel = document.getElementById('error-panel');
        errorPanel.style.display = 'none';
        const errorContainer = errorPanel.querySelector('.error-messages');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
        document.getElementById('submit-button').style.display = 'block';
    },
    
    // Validate data and display errors
    validateData: function(data, sectionName, requiredFields = []) {
        try {
            const parsedData = typeof data === 'string' ? DataUtils.safeJsonParse(data) : data;
            
            for (const field of requiredFields) {
                if (!parsedData[field] || parsedData[field] === "") {
                    const fieldName = field === 'name' ? 'Project Name' : field;
                    this.displayError(`'${sectionName}' section is missing required field: ${fieldName}`);
                }
            }
            
            return parsedData;
        } catch (e) {
            this.displayError(`'${sectionName}' section is incomplete`);
            return null;
        }
    }
};

// Data processors for specific sections
const DataProcessors = {
    processContacts: function(techData, managerData) {
        const contacts = [];
        
        // Process Technical Contact
        const techContact = DataUtils.safeJsonParse(techData);
        const managerContact = DataUtils.safeJsonParse(managerData);
        
        if ((!techContact || !techContact.contactEmail) && 
            (!managerContact || !managerContact.contactEmail)) {
            ErrorHandler.displayError("At least one contact (Technical Contact or Delivery Manager) is required");
        }
        
        // Add technical contact
        contacts.push({
            email: techContact?.contactEmail || "",
            roles: ["Technical Contact"],
            grade: techContact?.role || ""
        });
        
        // Add delivery manager
        contacts.push({
            email: managerContact?.contactEmail || "",
            roles: ["Delivery Manager"],
            grade: managerContact?.role || ""
        });
        
        return contacts;
    },
    
    processSourceControl: function(sourceControlData) {
        const data = DataUtils.safeJsonParse(sourceControlData);
        if (!data || !data.source_control) return '';
        
        let details = data.source_control;
        if (data.links && data.links.length > 0) {
            data.links.forEach(link => {
                if (link.description && link.url) {
                    details += `<br>${link.description}: ${link.url}`;
                }
            });
        }
        
        return details;
    },
    
    processHosting: function(hostingData) {
        const data = DataUtils.safeJsonParse(hostingData);
        if (!data || !data.type) return '';
        
        if (data.type === "On-premises") {
            return "On-Premises";
        }
        
        const hostingValues = [];
        if (data.main && data.main.length) hostingValues.push(...data.main);
        if (data.others && data.others.length) hostingValues.push(...data.others);
        
        return DataUtils.arrToList(hostingValues);
    },
    
    processDeveloped: function(developedData) {
        const data = DataUtils.safeJsonParse(developedData);
        if (!data) return '';
        
        let result = '';
        if (data.developed) {
            // Object format
            result += 'Developed: <p style="font-weight:400">' + data.developed + '</p>';
            
            if (data.developed === "Partnership" && data.partnership_company) {
                result += `Partnership Company: <p style="font-weight:400">${data.partnership_company}</p>`;
            } else if (data.developed === "Outsourced" && data.outsource_company) {
                result += `Outsourced Company: <p style="font-weight:400">${data.outsource_company}</p>`;
            }
        } else if (Array.isArray(data) && data.length > 0) {
            // Array format - [development_type, company_name]
            result += 'Developed: <p style="font-weight:400">' + data[0] + '</p>';
            
            if ((data[0] === "Partnership" || data[0] === "Outsourced") && data[1]) {
                let companyName = data[1];
                if (Array.isArray(data[1])) {
                    companyName = data[1][0] || '';
                }
                
                if (companyName && companyName !== '') {
                    result += `${data[0]} Company: <p style="font-weight:400">${companyName}</p>`;
                }
            }
        }
        
        return result;
    },
    
    processProjectDetails: function(projectData) {
        const data = DataUtils.safeJsonParse(projectData);
        if (!data) return '';
        
        let details = '';
        
        // Process for both API and form data formats
        const name = data.name || (data.details && data.details[0]?.name);
        const shortName = data.short_name || (data.details && data.details[0]?.short_name);
        const programmeName = data.programme_name || '';
        const programmeShortName = data.programme_short_name || '';
        const docLink = data.documentation_link || '';
        const projectDescription = data.project_description || '';

        if (programmeName) {
            details += 'Programme Name: <p style="font-weight:400">' + programmeName + '</p>';
        }
        if (programmeShortName) {
            details += 'Programme Short Name: <p style="font-weight:400">' + programmeShortName + '</p>';
        }
        if (name) {
            details += 'Project Name: <p style="font-weight:400">' + name + '</p>';
        }
        if (shortName) {
            details += 'Short Name: <p style="font-weight:400">' + shortName + '</p>';
        }
        if (docLink) {
            details += 'Documentation Link: <p style="font-weight:400">' + docLink + '</p>';
        }
        if (projectDescription) {
            details += 'Project Description: <p style="font-weight:400">' + projectDescription + '</p>';
        }
        
        return details;
    }
};

// Data normalization class
const DataNormalizer = {
    // Convert API format to consistent internal format
    normalizeApiData: function(apiData) {
        // Deep clone the original data to avoid modifying it
        const data = JSON.parse(JSON.stringify(apiData));
        
        // Extract additional users
        const additionalUsers = data.user.filter(user => 
            !user.roles.includes('Technical Contact') && 
            !user.roles.includes('Delivery Manager')
        );
        
        if (additionalUsers.length > 0) {
            localStorage.setItem('additional_users-edit', JSON.stringify(additionalUsers));
        } else {
            localStorage.removeItem('additional_users-edit');
        }
        
        // Transform contact data
        for (let i = 0; i < Math.min(2, data.user.length); i++) {
            data.user[i].contactEmail = data.user[i].email;
            data.user[i].role = data.user[i].grade;
            delete data.user[i].email;
            delete data.user[i].grade;
            delete data.user[i].roles;
        }
        
        // Transform source control data
        const sourceControl = {
            source_control: data.source_control[0]?.type || '',
            links: data.source_control[0]?.links || []
        };
        
        // Transform hosting data
        const hosting = {
            type: data.architecture.hosting.type[0] || '',
            main: [],
            others: data.architecture.hosting.details || []
        };
        
        // Process developed data
        let developedData;
        if (Array.isArray(data.developed) && data.developed.length > 0) {
            const developedType = data.developed[0] || '';
            let companyName = '';
            
            if (data.developed.length > 1) {
                if (Array.isArray(data.developed[1])) {
                    companyName = data.developed[1][0] || '';
                } else {
                    companyName = data.developed[1] || '';
                }
            }
            
            developedData = {
                developed: developedType,
                outsource_company: developedType === 'Outsourced' ? companyName : null,
                partnership_company: developedType === 'Partnership' ? companyName : null,
                complete: true
            };
        } else {
            developedData = {
                developed: '',
                outsource_company: null,
                partnership_company: null,
                complete: false
            };
        }
        
        // Prepare normalized data
        return {
            contact_tech: data.user[0] || { contactEmail: '', role: '' },
            contact_manager: data.user[1] || { contactEmail: '', role: '' },
            project: data.details[0] || {},
            developed: developedData,
            stage: { stage: data.stage },
            source_control: sourceControl,
            hosting: hosting,
            database: data.architecture.database,
            languages: data.architecture.languages,
            frameworks: data.architecture.frameworks,
            integrations: data.architecture.cicd,
            infrastructure: data.architecture.infrastructure,
            code_editors: data.supporting_tools.code_editors,
            user_interface: data.supporting_tools.user_interface,
            diagrams: data.supporting_tools.diagrams,
            project_tracking: { project_tracking: data.supporting_tools.project_tracking },
            documentation: data.supporting_tools.documentation,
            communication: data.supporting_tools.communication,
            collaboration: data.supporting_tools.collaboration,
            incident_management: { incident_management: data.supporting_tools.incident_management }
        };
    },
    
    // Save normalized data to localStorage
    saveToLocalStorage: function(normalizedData, isEdit) {
        const suffix = isEdit ? '-edit' : '';
        
        // Store each section in localStorage
        Object.entries(normalizedData).forEach(([key, value]) => {
            localStorage.setItem(`${key}-data${suffix}`, JSON.stringify(value));
        });
    },
    
    // Create API format data from processed data
    createApiFormat: function(processedData) {
        // Extract users and add any additional users from previous edit
        const additionalUsers = DataUtils.safeJsonParse(localStorage.getItem('additional_users-edit') || '[]');
        
        // Deep clone the data to avoid modifying the original
        const cleanedData = JSON.parse(JSON.stringify(processedData));
        
        // Clean up any 'complete' property from all objects
        const cleanObject = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            
            if ('complete' in obj) delete obj.complete;
            
            Object.values(obj).forEach(value => {
                if (value && typeof value === 'object') {
                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (item && typeof item === 'object') cleanObject(item);
                        });
                    } else {
                        cleanObject(value);
                    }
                }
            });
        };
        
        cleanObject(cleanedData);
        
        // Handle the developed data format
        let developedData;
        if (cleanedData.developed) {
            if (Array.isArray(cleanedData.developed)) {
                developedData = cleanedData.developed;
            } else if (cleanedData.developed.developed) {
                const developedType = cleanedData.developed.developed;
                let companyName = '';
                
                if (developedType === 'Outsourced' && cleanedData.developed.outsource_company) {
                    companyName = cleanedData.developed.outsource_company;
                } else if (developedType === 'Partnership' && cleanedData.developed.partnership_company) {
                    companyName = cleanedData.developed.partnership_company;
                }
                
                developedData = [developedType, companyName];
            } else {
                developedData = ["", ""];
            }
        } else {
            developedData = ["", ""];
        }
        
        // Construct the final data format
        const finalData = {
            user: cleanedData.user || [],
            details: cleanedData.project || {},
            developed: developedData,
            source_control: [{
                type: cleanedData.source_control?.source_control || '',
                links: cleanedData.source_control?.links || []
            }],
            architecture: {
                frameworks: cleanedData.frameworks || { main: [], others: [] },
                infrastructure: cleanedData.infrastructure || { main: [], others: [] },
                integrations: cleanedData.integrations || { main: [], others: [] },
                languages: cleanedData.languages || { main: [], others: [] },
                hosting: {
                    type: Array.isArray(cleanedData.hosting?.type) ? 
                        cleanedData.hosting.type : 
                        [cleanedData.hosting?.type || ''],
                    details: cleanedData.hosting?.others || []
                },
                database: cleanedData.database || { main: [], others: [] },
            },
            stage: cleanedData.stage?.stage || '',
            supporting_tools: {
                code_editors: cleanedData.code_editors || { main: [], others: [] },
                user_interface: cleanedData.user_interface || { main: [], others: [] },
                diagrams: cleanedData.diagrams || { main: [], others: [] },
                project_tracking: cleanedData.project_tracking?.project_tracking || '',
                documentation: cleanedData.documentation || { main: [], others: [] },
                communication: cleanedData.communication || { main: [], others: [] },
                collaboration: cleanedData.collaboration || { main: [], others: [] },
                incident_management: cleanedData.incident_management?.incident_management || ''
            }
        };
        
        // Add edit-specific properties
        if (JSON.parse(localStorage.getItem('edit'))) {
            finalData.project_name = window.projectName; // This will be set from the template
            if (additionalUsers.length > 0) {
                finalData.project_users = [...cleanedData.user, ...additionalUsers];
            } else {
                finalData.project_users = cleanedData.user;
            }
        }
        
        return finalData;
    }
};

// UI Update class
const UIUpdater = {
    // Update the summary display with processed data
    updateSummaryDisplay: function(data) {
        const summaryData = {
            technical_contact: data.user[0]?.email ? 
                `${data.user[0].email} (${data.user[0].grade || ''})` : '',
            delivery_manager: data.user[1]?.email ? 
                `${data.user[1].email} (${data.user[1].grade || ''})` : '',
            stage_details: data.stage || '',
            project_details: DataProcessors.processProjectDetails(JSON.stringify({
                name: data.details.name,
                short_name: data.details.short_name,
                programme_name: data.details.programme_name,
                programme_short_name: data.details.programme_short_name,
                documentation_link: data.details.documentation_link,
                project_description: data.details.project_description
            })),
            developed_details: DataProcessors.processDeveloped(JSON.stringify(data.developed)),
            source_control_details: data.source_control[0]?.type ? 
                `${data.source_control[0].type}${data.source_control[0].links.map(link => 
                    `<br>${link.description}: <a href="${link.url}" target="_blank">${link.url}</a>`).join('')}` : '',
            hosting_details: data.architecture.hosting.type ? 
                (data.architecture.hosting.type[0] === "On-premises" ? "On-Premises" : 
                    DataUtils.arrToList(data.architecture.hosting.details)) : '',
            database_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.architecture.database, 'main', []), 
                ...DataUtils.safeGet(data.architecture.database, 'others', [])
            ]),
            languages_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.architecture.languages, 'main', []), 
                ...DataUtils.safeGet(data.architecture.languages, 'others', [])
            ]),
            framework_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.architecture.frameworks, 'main', []), 
                ...DataUtils.safeGet(data.architecture.frameworks, 'others', [])
            ]),
            integration_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.architecture.integrations, 'main', []), 
                ...DataUtils.safeGet(data.architecture.integrations, 'others', [])
            ]),
            infrastructure_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.architecture.infrastructure, 'main', []), 
                ...DataUtils.safeGet(data.architecture.infrastructure, 'others', [])
            ]),
            code_editor_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.code_editors, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.code_editors, 'others', [])
            ]),
            user_interface_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.user_interface, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.user_interface, 'others', [])
            ]),
            diagram_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.diagrams, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.diagrams, 'others', [])
            ]),
            project_tracking_details: data.supporting_tools.project_tracking || '',
            documentation_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.documentation, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.documentation, 'others', [])
            ]),
            communication_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.communication, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.communication, 'others', [])
            ]),
            collaboration_details: DataUtils.arrToList([
                ...DataUtils.safeGet(data.supporting_tools.collaboration, 'main', []), 
                ...DataUtils.safeGet(data.supporting_tools.collaboration, 'others', [])
            ]),
            incident_management_details: data.supporting_tools.incident_management || ''
        };
        
        // Update all summary elements
        Object.entries(summaryData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.innerHTML = value;
        });
    },
    
    // Update the hidden form fields for submission
    updateHiddenFields: function(data) {
        const hiddenFields = {
            user: data.user,
            project: data.details,
            developed: data.developed,
            source_control: data.source_control,
            hosting: {
                type: Array.isArray(data.architecture.hosting.type) ? 
                    data.architecture.hosting.type : 
                    [data.architecture.hosting.type],
                details: data.architecture.hosting.details
            },
            database: data.architecture.database,
            languages: data.architecture.languages,
            frameworks: data.architecture.frameworks,
            integrations: data.architecture.integrations,
            infrastructure: data.architecture.infrastructure,
            stage: data.stage,
            code_editors: data.supporting_tools.code_editors,
            user_interface: data.supporting_tools.user_interface,
            diagrams: data.supporting_tools.diagrams,
            project_tracking: data.supporting_tools.project_tracking,
            documentation: data.supporting_tools.documentation,
            communication: data.supporting_tools.communication,
            collaboration: data.supporting_tools.collaboration,
            incident_management: data.supporting_tools.incident_management
        };
        
        if (data.project_name) {
            hiddenFields.project_name = data.project_name;
        }
        
        if (data.project_users) {
            hiddenFields.project_users = data.project_users;
        }
        
        Object.entries(hiddenFields).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.value = JSON.stringify(value);
        });
    }
};

// Main application controller
const AppController = {
    getFields: function(isEdit) {
        const suffix = isEdit ? '-edit' : '';
        return [
            `contact_tech-data${suffix}`, `contact_manager-data${suffix}`, `project-data${suffix}`, 
            `developed-data${suffix}`, `stage-data${suffix}`, `source_control-data${suffix}`, 
            `hosting-data${suffix}`, `database-data${suffix}`, `frameworks-data${suffix}`, 
            `infrastructure-data${suffix}`, `integrations-data${suffix}`, `languages-data${suffix}`, 
            `code_editors-data${suffix}`, `user_interface-data${suffix}`, `diagrams-data${suffix}`, 
            `project_tracking-data${suffix}`, `documentation-data${suffix}`, `communication-data${suffix}`, 
            `collaboration-data${suffix}`, `incident_management-data${suffix}`
        ];
    },
    
    loadData: function() {
        ErrorHandler.clearErrors();
        
        const isEdit = JSON.parse(localStorage.getItem('edit') || 'false');
        const fieldKeys = this.getFields(isEdit);
        
        if (isEdit && window.originalData) {
            try {
                localStorage.setItem("original_data", JSON.stringify(window.originalData));
                
                let fieldsExist = fieldKeys.every(key => localStorage.getItem(key));
                
                if (!fieldsExist) {
                    const normalizedData = DataNormalizer.normalizeApiData(window.originalData);
                    DataNormalizer.saveToLocalStorage(normalizedData, true);
                }
            } catch (e) {
                console.error("Error processing original data:", e);
            }
        }
        
        const storedData = {};
        fieldKeys.forEach(key => {
            const shortKey = key.replace(/-data(-edit)?$/, '');
            storedData[shortKey] = localStorage.getItem(key);
        });
        
        const processedData = {
            user: DataProcessors.processContacts(storedData['contact_tech'], storedData['contact_manager']),
            project: ErrorHandler.validateData(storedData['project'], 'Project', ['name']),
            developed: ErrorHandler.validateData(storedData['developed'], 'Developed'),
            stage: ErrorHandler.validateData(storedData['stage'], 'Stage'),
            source_control: DataUtils.safeJsonParse(storedData['source_control']),
            hosting: DataUtils.safeJsonParse(storedData['hosting']),
            database: ErrorHandler.validateData(storedData['database'], 'Databases'),
            languages: ErrorHandler.validateData(storedData['languages'], 'Languages'),
            frameworks: ErrorHandler.validateData(storedData['frameworks'], 'Frameworks'),
            integrations: ErrorHandler.validateData(storedData['integrations'], 'CI/CD'),
            infrastructure: ErrorHandler.validateData(storedData['infrastructure'], 'Infrastructure'),
            code_editors: ErrorHandler.validateData(storedData['code_editors'], 'Code Editors'),
            user_interface: ErrorHandler.validateData(storedData['user_interface'], 'User Interface'),
            diagrams: ErrorHandler.validateData(storedData['diagrams'], 'Diagrams'),
            project_tracking: DataUtils.safeJsonParse(storedData['project_tracking']),
            documentation: ErrorHandler.validateData(storedData['documentation'], 'Documentation'),
            communication: ErrorHandler.validateData(storedData['communication'], 'Communication'),
            collaboration: ErrorHandler.validateData(storedData['collaboration'], 'Collaboration'),
            incident_management: DataUtils.safeJsonParse(storedData['incident_management'])
        };
        
        if (isEdit && (!processedData.project || !processedData.project.name)) {
            try {
                let originalData = JSON.parse(localStorage.getItem("original_data") || "{}");
                if (originalData && originalData.details && originalData.details[0]) {
                    processedData.project = originalData.details[0];
                }
            } catch (e) {
                console.error("Error using fallback data:", e);
            }
        }
        
        const finalData = DataNormalizer.createApiFormat(processedData);
        
        UIUpdater.updateSummaryDisplay(finalData);
        UIUpdater.updateHiddenFields(finalData);
    },
    
    init: function() {
        this.loadData();
        localStorage.setItem("source_control-validate", true);
        localStorage.setItem("hosting-validate", true);
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    AppController.init();
});

// Legacy function support
function api_to_ui(api_data) {
    const normalizedData = DataNormalizer.normalizeApiData(api_data);
    DataNormalizer.saveToLocalStorage(normalizedData, true);
}

function load_data() {
    AppController.loadData();
}

function removeEdits() {
    const isEdit = JSON.parse(localStorage.getItem('edit') || 'false');
    if (isEdit) {
        const fieldKeys = AppController.getFields(true);
        fieldKeys.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('additional_users-edit');
    }
}
