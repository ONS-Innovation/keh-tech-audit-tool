// Utility class for common operations
class SummaryUtils {
    static escapeHtml(str) {
        if (!str) return '';
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, match => escapeMap[match]);
    }

    static safeJsonParse(data, defaultValue = null) {
        try {
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('JSON parse error:', e);
            return defaultValue;
        }
    }

    static updateElement(elementId, content) {
        const element = document.getElementById(elementId)?.querySelector('dd.ons-summary__values span.ons-summary__text');
        if (element) {
            element.innerHTML = SummaryUtils.escapeHtml(content);
        }
    }
}

// Class to handle error management
class ErrorManager {
    constructor(errorPanelId, errorLabelId) {
        this.errorPanel = document.getElementById(errorPanelId);
        this.errorLabel = document.getElementById(errorLabelId);
        this.errorList = [];
    }

    addError(message) {
        this.errorList.push(message);
        this.showErrors();
    }

    showErrors() {
        if (this.errorList.length > 0) {
            this.errorPanel.classList.remove('ons-u-hidden');
            this.errorLabel.innerHTML = this.errorList.join('<br>');
        }
    }

    hideSubmitButton() {
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.style.display = 'none';
        }
    }
}

// Base class for section data processing
class SectionProcessor {
    constructor(errorManager) {
        this.errorManager = errorManager;
    }

    processData(data) {
        throw new Error('processData must be implemented by child classes');
    }

    updateUI(elementId, value) {
        SummaryUtils.updateElement(elementId, value);
    }
}

// Contact section processor
class ContactProcessor extends SectionProcessor {
    processData(techContactData, managerData) {
        try {
            const techContact = SummaryUtils.safeJsonParse(techContactData);
            const manager = SummaryUtils.safeJsonParse(managerData);

            if (!techContact && !manager) {
                this.errorManager.addError('At least one contact (Technical Contact or Delivery Manager) is required.');
                this.errorManager.hideSubmitButton();
                return '';
            }

            if (techContact && (techContact.contactEmail === '' || techContact.role === '')) {
                this.errorManager.addError('The Technical Contact email and role are required.');
                this.errorManager.hideSubmitButton();
                return '';
            }

            if (manager && (manager.contactEmail === '' || manager.role === '')) {
                this.errorManager.addError('The Delivery Manager email and role are required.');
                this.errorManager.hideSubmitButton();
                return '';
            }

            let details = '';
            if (techContact) {
                const email = SummaryUtils.escapeHtml(techContact.contactEmail);
                const role = SummaryUtils.escapeHtml(techContact.role);
                details += `Technical Contact:<br><span style="font-weight: 400;">${email} (${role})</span><br><br>`;
            }

            if (manager?.contactEmail) {
                const email = SummaryUtils.escapeHtml(manager.contactEmail || '');
                const role = SummaryUtils.escapeHtml(manager.role || '');
                details += `Delivery Manager Contact:<br><span style="font-weight: 400;">${email} (${role})</span>`;
            }

            return details;
        } catch (e) {
            console.error('Error processing contact data:', e);
            return '';
        }
    }
}

// Project details processor
class ProjectProcessor extends SectionProcessor {
    processData(projectData) {
        try {
            const project = SummaryUtils.safeJsonParse(projectData);
            if (!project) {
                this.errorManager.addError('Project details are required.');
                this.errorManager.hideSubmitButton();
                return '';
            }

            let details = '';
            const fields = [
                { key: 'programme_name', label: 'Programme Name' },
                { key: 'programme_short_name', label: 'Programme Short Name' },
                { key: 'name', label: 'Project Name' },
                { key: 'short_name', label: 'Project Short Name' },
                { key: 'documentation_link', label: 'Documentation Link', isArray: true },
                { key: 'project_description', label: 'Project Description' }
            ];

            for (const field of fields) {
                let value = project[field.key];
                if (field.isArray && Array.isArray(value)) {
                    value = value[0];
                }
                
                if (value && value !== '') {
                    const escapedValue = SummaryUtils.escapeHtml(value);
                    details += `${field.label}:<p style="font-weight: 400;">${escapedValue}</p>`;
                }
            }

            // Validate project name
            if (!project.name || project.name.trim() === '') {
                this.errorManager.addError('Project name is required.');
                this.errorManager.hideSubmitButton();
            }

            return details;
        } catch (e) {
            console.error('Error processing project data:', e);
            this.errorManager.addError('Error processing project data.');
            this.errorManager.hideSubmitButton();
            return '';
        }
    }
}

// Stage processor
class StageProcessor extends SectionProcessor {
    processData(stageData) {
        try {
            const stage = SummaryUtils.safeJsonParse(stageData);
            return stage?.stage ? SummaryUtils.escapeHtml(stage.stage) : '';
        } catch (e) {
            console.error('Error processing stage data:', e);
            return '';
        }
    }
}

// Development details processor
class DevelopedProcessor extends SectionProcessor {
    processData(developedData) {
        try {
            const developed = SummaryUtils.safeJsonParse(developedData);
            if (!developed || !developed[0]) return '';

            let details = '';
            const devType = SummaryUtils.escapeHtml(developed[0]);
            if (devType === '') {
                return '';
            }
            details += `Developed:<p style="font-weight: 400;">${devType}</p>`;

            if ((developed[0] === "Outsourced" || developed[0] === "Partnership") && developed[1]) {
                const companyName = SummaryUtils.escapeHtml(developed[1]);
                details += `${devType} Company:<p style="font-weight: 400;">${companyName}</p>`;
            }

            return details;
        } catch (e) {
            console.error('Error processing developed data:', e);
            return '';
        }
    }
}

// Project Dependencies processor
class ProjectDependenciesProcessor extends SectionProcessor {
    processData(projectDependenciesData) {
        try {
            const data = SummaryUtils.safeJsonParse(projectDependenciesData);
            if (!data || !Array.isArray(data) || data.length === 0) return '';
            let html = '';
            data.forEach(dep => {
                if (dep.name && dep.description) {
                    const name = SummaryUtils.escapeHtml(dep.name);
                    const description = SummaryUtils.escapeHtml(dep.description);
                    html += `${name}: <span style=\"font-weight: 400;\">${description}</span><br>`;
                } else if (dep.name) {
                    const name = SummaryUtils.escapeHtml(dep.name);
                    html += `${name}<br>`;
                }
            });
            return html;
        } catch (e) {
            console.error('Error processing project dependencies:', e);
            return '';
        }
    }
}

// Main summary manager
class SummaryManager {
    constructor() {
        this.errorManager = new ErrorManager('error-panel', 'error-label');
        this.contactProcessor = new ContactProcessor(this.errorManager);
        this.projectProcessor = new ProjectProcessor(this.errorManager);
        this.stageProcessor = new StageProcessor(this.errorManager);
        this.developedProcessor = new DevelopedProcessor(this.errorManager);
        this.projectDependenciesProcessor = new ProjectDependenciesProcessor(this.errorManager);
    }

    loadData() {
        // Process contact information
        const contactDetails = this.contactProcessor.processData(
            localStorage.getItem('contact_tech-data'),
            localStorage.getItem('contact_manager-data')
        );
        this.contactProcessor.updateUI('user_details', contactDetails);

        // Process project information
        const projectDetails = this.projectProcessor.processData(
            localStorage.getItem('project-data')
        );
        this.projectProcessor.updateUI('project_details', projectDetails);

        // Process stage information
        const stageDetails = this.stageProcessor.processData(
            localStorage.getItem('stage-data')
        );
        this.stageProcessor.updateUI('stage_details', stageDetails);

        // Process project dependencies
        const project_dependencies_details = this.projectDependenciesProcessor.processData(
            localStorage.getItem('project_dependencies-data')
        );
        this.projectProcessor.updateUI('project_dependencies_details', project_dependencies_details);

        // Process development information
        const developedDetails = this.developedProcessor.processData(
            localStorage.getItem('developed-data')
        );
        this.developedProcessor.updateUI('developed_details', developedDetails);

        // Set hidden input values
        this.setHiddenInputs();
    }

    setHiddenInputs() {
        const inputs = {
            'user': 'contact_tech-data',
            'project': 'project-data',
            'developed': 'developed-data',
            'stage': 'stage-data'
        };

        for (const [elementId, storageKey] of Object.entries(inputs)) {
            const element = document.getElementById(elementId);
            const data = localStorage.getItem(storageKey);
            if (element && data) {
                element.value = data;
            }
        }
    }
}

// Architecture Summary Processors
class SourceControlProcessor extends SectionProcessor {
    processData(sourceControlData) {
        try {
            const data = SummaryUtils.safeJsonParse(sourceControlData);
            if (!data) return '';

            let sourceControlHtml = `${data.source_control}`;
            
            if (data.links && data.links.length > 0) {
                data.links.forEach(link => {
                    if (link.description && link.url) {
                        sourceControlHtml += `<br>${SummaryUtils.escapeHtml(link.description)}: <a href="${SummaryUtils.escapeHtml(link.url)}" target="_blank">${SummaryUtils.escapeHtml(link.url)}</a>`;
                    }
                });
            }

            return sourceControlHtml;
        } catch (e) {
            console.error('Error processing source control data:', e);
            return '';
        }
    }
}

class HostingProcessor extends SectionProcessor {
    processData(hostingData) {
        try {
            const data = SummaryUtils.safeJsonParse(hostingData);
            if (!data) return '';
            
            if (typeof data === 'string') {
                return SummaryUtils.escapeHtml(data);
            }
            
            if (Array.isArray(data)) {
                return data.length > 0 ? SummaryUtils.escapeHtml(data[0]) : '';
            }
            
            const type = data.type ? SummaryUtils.escapeHtml(data.type) : '';
            const others = data.others ? data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ') : '';
            
            if (type === 'On-premises') {
                return 'On-premises';
            }
            
            if (type && others) {
                return `${type}: ${others}`;
            }
            
            if (type) {
                return type;
            }
            
            if (others) {
                return `Cloud: ${others}`;
            }
            
            return '';
        } catch (e) {
            return '';
        }
    }
}

class DatabaseProcessor extends SectionProcessor {
    processData(databaseData) {
        try {
            const data = SummaryUtils.safeJsonParse(databaseData);
            if (!data || !data.others) return '';

            return data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ');
        } catch (e) {
            console.error('Error processing database data:', e);
            return '';
        }
    }
}

// Tech Summary Processors
class LanguagesProcessor extends SectionProcessor {
    processData(languagesData) {
        try {
            const data = SummaryUtils.safeJsonParse(languagesData);
            if (!data) return '';

            let details = '';
            if (data.main && data.main.length > 0) {
                details += `Primary: ${data.main.map(item => SummaryUtils.escapeHtml(item)).join(', ')}`;
            }
            if (data.others && data.others.length > 0) {
                if (details) details += '<br>';
                details += `Other: ${data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ')}`;
            }
            return details;
        } catch (e) {
            console.error('Error processing languages data:', e);
            return '';
        }
    }
}

class FrameworksProcessor extends SectionProcessor {
    processData(frameworksData) {
        try {
            const data = SummaryUtils.safeJsonParse(frameworksData);
            if (!data || !data.others) return '';

            return data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ');
        } catch (e) {
            console.error('Error processing frameworks data:', e);
            return '';
        }
    }
}

class IntegrationsProcessor extends SectionProcessor {
    processData(integrationsData) {
        try {
            const data = SummaryUtils.safeJsonParse(integrationsData);
            if (!data || !data.others) return '';

            return data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ');
        } catch (e) {
            console.error('Error processing integrations data:', e);
            return '';
        }
    }
}

class InfrastructureProcessor extends SectionProcessor {
    processData(infrastructureData) {
        try {
            const data = SummaryUtils.safeJsonParse(infrastructureData);
            if (!data || !data.others) return '';

            return data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ');
        } catch (e) {
            console.error('Error processing infrastructure data:', e);
            return '';
        }
    }
}

class MiscellaneousProcessor extends SectionProcessor {
    processData(miscellaneousData) {
        try {
            const data = SummaryUtils.safeJsonParse(miscellaneousData);
            if (!data || !Array.isArray(data)) return '';

            let html = '';
            data.forEach(item => {
                if (item.name && item.description) {
                    const name = SummaryUtils.escapeHtml(item.name);
                    const description = SummaryUtils.escapeHtml(item.description);
                    html += `${name}: <span style="font-weight: 400;">${description}</span><br>`;
                }
            });

            return html;
        } catch (e) {
            console.error('Error processing miscellaneous data:', e);
            return '';
        }
    }
}

class PublishingProcessor extends SectionProcessor {
    processData(publishingData) {
        try {
            const data = SummaryUtils.safeJsonParse(publishingData);
            if (!data) return '';

            let details = '';
            if (data.main && data.main.length > 0) {
                details += `Internal: ${data.main.map(item => SummaryUtils.escapeHtml(item)).join(', ')}`;
            }
            if (data.others && data.others.length > 0) {
                if (details) details += '<br>';
                details += `External: ${data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ')}`;
            }
            return details;
        } catch (e) {
            console.error('Error processing publishing data:', e);
            return '';
        }
    }
}

// Supporting Tools Processors
class ToolsProcessor extends SectionProcessor {
    processData(toolData) {
        try {
            const data = SummaryUtils.safeJsonParse(toolData);
            if (!data || !data.others) return '';
 
            return data.others.map(item => SummaryUtils.escapeHtml(item)).join(', ');
        } catch (e) {
            console.error('Error processing tool data:', e);
            return '';
        }
    }
}

class SingleValueProcessor extends SectionProcessor {
    constructor(errorManager, valueKey) {
        super(errorManager);
        this.valueKey = valueKey;
    }

    processData(data) {
        try {
            const parsed = SummaryUtils.safeJsonParse(data);
            if (!parsed || !parsed[this.valueKey]) return '';

            return SummaryUtils.escapeHtml(parsed[this.valueKey]);
        } catch (e) {
            console.error(`Error processing ${this.valueKey} data:`, e);
            return '';
        }
    }
}

// Architecture Summary Manager
class ArchitectureSummaryManager {
    constructor() {
        this.errorManager = new ErrorManager('error-panel', 'error-label');
        this.sourceControlProcessor = new SourceControlProcessor(this.errorManager);
        this.hostingProcessor = new HostingProcessor(this.errorManager);
        this.databaseProcessor = new DatabaseProcessor(this.errorManager);
    }

    loadData() {
        const sourceControlDetails = this.sourceControlProcessor.processData(
            localStorage.getItem('source_control-data')
        );
        this.sourceControlProcessor.updateUI('source_control_details', sourceControlDetails);

        const hostingDetails = this.hostingProcessor.processData(
            localStorage.getItem('hosting-data')
        );
        this.hostingProcessor.updateUI('hosting_details', hostingDetails);

        const databaseDetails = this.databaseProcessor.processData(
            localStorage.getItem('database-data')
        );
        this.databaseProcessor.updateUI('database_details', databaseDetails);
    }
}

// Tech Summary Manager
class TechSummaryManager {
    constructor() {
        this.errorManager = new ErrorManager('error-panel', 'error-label');
        this.languagesProcessor = new LanguagesProcessor(this.errorManager);
        this.frameworksProcessor = new FrameworksProcessor(this.errorManager);
        this.integrationsProcessor = new IntegrationsProcessor(this.errorManager);
        this.infrastructureProcessor = new InfrastructureProcessor(this.errorManager);
        this.publishingProcessor = new PublishingProcessor(this.errorManager);
    }

    loadData() {
        const languagesDetails = this.languagesProcessor.processData(
            localStorage.getItem('languages-data')
        );
        this.languagesProcessor.updateUI('languages_details', languagesDetails);

        const frameworkDetails = this.frameworksProcessor.processData(
            localStorage.getItem('frameworks-data')
        );
        this.frameworksProcessor.updateUI('framework_details', frameworkDetails);

        const integrationDetails = this.integrationsProcessor.processData(
            localStorage.getItem('integrations-data')
        );
        this.integrationsProcessor.updateUI('integration_details', integrationDetails);

        const infrastructureDetails = this.infrastructureProcessor.processData(
            localStorage.getItem('infrastructure-data')
        );
        this.infrastructureProcessor.updateUI('infrastructure_details', infrastructureDetails);
        
        const publishingDetails = this.publishingProcessor.processData(
            localStorage.getItem('publishing-data')
        );
        this.publishingProcessor.updateUI('publishing_details', publishingDetails);
    }
}

// Supporting Tools Summary Manager
class SupportingToolsSummaryManager {
    constructor() {
        this.errorManager = new ErrorManager('error-panel', 'error-label');
        this.toolsProcessor = new ToolsProcessor(this.errorManager);
        this.miscellaneousProcessor = new MiscellaneousProcessor(this.errorManager);
        this.projectTrackingProcessor = new SingleValueProcessor(this.errorManager, 'project_tracking');
        this.incidentManagementProcessor = new SingleValueProcessor(this.errorManager, 'incident_management');
    }

    loadData() {
        const processors = {
            'code_editor_details': 'code_editors-data',
            'user_interface_details': 'user_interface-data',
            'diagram_details': 'diagrams-data',
            'documentation_details': 'documentation-data',
            'communication_details': 'communication-data',
            'miscellaneous_details': 'miscellaneous-data',
            'collaboration_details': 'collaboration-data'
        };

        // Process tools that use the standard ToolsProcessor
        for (const [elementId, storageKey] of Object.entries(processors)) {
            const details = this.toolsProcessor.processData(
                localStorage.getItem(storageKey)
            );
            this.toolsProcessor.updateUI(elementId, details);
        }

        const miscellaneousDetails = this.miscellaneousProcessor.processData(
            localStorage.getItem('miscellaneous-data')
        );
        this.miscellaneousProcessor.updateUI('miscellaneous_details', miscellaneousDetails);

        // Process project tracking
        const projectTrackingDetails = this.projectTrackingProcessor.processData(
            localStorage.getItem('project_tracking-data')
        );
        this.projectTrackingProcessor.updateUI('project_tracking_details', projectTrackingDetails);

        // Process incident management
        const incidentManagementDetails = this.incidentManagementProcessor.processData(
            localStorage.getItem('incident_management-data')
        );
        this.incidentManagementProcessor.updateUI('incident_management_details', incidentManagementDetails);
    }
}

// Initialize appropriate manager based on page
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('project_summary')) {
        const summaryManager = new SummaryManager();
        summaryManager.loadData();
    } else if (path.includes('architecture_summary')) {
        const architectureManager = new ArchitectureSummaryManager();
        architectureManager.loadData();
    } else if (path.includes('tech_summary')) {
        const techManager = new TechSummaryManager();
        techManager.loadData();
    } else if (path.includes('supporting_tools_summary')) {
        const toolsManager = new SupportingToolsSummaryManager();
        toolsManager.loadData();
    }
});