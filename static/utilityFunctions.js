/**
 * Tech Audit Tool - Utility Functions
 * Common functions used across the application
 */

// ===== HTML MANIPULATION =====

/**
 * Creates an HTML list from an array of items
 * @param {Array} arr - Array of items to convert to a list
 * @returns {string} HTML string representation of the list
 */
function arrToList(arr) {
    if (!arr || arr.length === 0) return '';
    
    let items = '';
    arr.forEach(item => {
        if (item && item !== "") {
            items += `<li>${escapeHtml(item)}</li>`;
        }
    });
    
    return items ? `<ul>${items}</ul>` : '';
}

/**
 * Redirects to the previous page if the back button was clicked
 * This function is called on form pages to handle navigation
 */
function redirectToPrevious() {
    // Check if we came from a "Back" button click
    const params = new URLSearchParams(window.location.search);
    if (params.has('back') && params.get('back') === 'true') {
        // Find the submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            // Change button text to indicate going back
            submitBtn.innerHTML = 'Save and go back';
        }
    }
}

/**
 * Escapes HTML special characters in a string to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

/**
 * Creates a loading indicator element
 * @returns {HTMLElement} The loading indicator element
 */
function createLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>Loading, please wait...</p>
    `;
    return loader;
}

// ===== DATA MANIPULATION =====

/**
 * Safely parses a JSON string
 * @param {string} jsonString - The JSON string to parse
 * @param {Object} defaultValue - Default value to return if parsing fails
 * @returns {Object} The parsed JSON or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
    try {
        if (!jsonString) return defaultValue;
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        return defaultValue;
    }
}

/**
 * Gets all data from localStorage with a specific prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {Object} Object containing all matching data
 */
function getLocalStorageByPrefix(prefix) {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            result[key] = localStorage.getItem(key);
        }
    }
    return result;
}

/**
 * Clears all localStorage items with a specific prefix
 * @param {string} prefix - The prefix for items to clear
 */
function clearLocalStorageByPrefix(prefix) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
        }
    }
}

// ===== ARRAY/OBJECT HELPERS =====

/**
 * Checks if an array or object is empty
 * @param {Array|Object} item - The array or object to check
 * @returns {boolean} True if empty, false otherwise
 */
function isEmpty(item) {
    if (!item) return true;
    
    if (Array.isArray(item)) {
        return item.length === 0 || item.every(element => !element || element === "");
    }
    
    if (typeof item === 'object') {
        return Object.keys(item).length === 0;
    }
    
    return false;
}

/**
 * Deep clones an object
 * @param {Object} obj - The object to clone
 * @returns {Object} A deep clone of the object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj);
    }
    
    // Handle Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    // Handle Object
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = deepClone(obj[key]);
        }
    }
    
    return result;
}

/**
 * Merges two objects deeply
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
    if (!source) return target;
    const result = { ...target };
    
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] instanceof Object && key in target) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

// ===== FORM HELPERS =====

/**
 * Validates a form input element
 * @param {HTMLElement} input - The input element to validate
 * @param {Function} validationFn - The validation function
 * @param {string} errorMessage - Error message to display if validation fails
 * @returns {boolean} True if valid, false otherwise
 */
function validateInput(input, validationFn, errorMessage) {
    const isValid = validationFn(input.value);
    const errorElement = input.nextElementSibling;
    
    if (!isValid) {
        input.classList.add('error');
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        } else {
            const newError = document.createElement('div');
            newError.className = 'error-message';
            newError.textContent = errorMessage;
            input.parentNode.insertBefore(newError, input.nextSibling);
        }
        return false;
    } else {
        input.classList.remove('error');
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
        return true;
    }
}

/**
 * Sets form field values from an object
 * @param {string} formId - The ID of the form
 * @param {Object} data - Object containing the field values
 */
function populateForm(formId, data) {
    const form = document.getElementById(formId);
    if (!form || !data) return;
    
    Object.keys(data).forEach(key => {
        const field = form.elements[key];
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = !!data[key];
            } else if (field.type === 'radio') {
                const radio = Array.from(form.elements[key]).find(r => r.value === data[key]);
                if (radio) radio.checked = true;
            } else {
                field.value = data[key] || '';
            }
        }
    });
}

/**
 * Gets form data as an object
 * @param {string} formId - The ID of the form
 * @returns {Object} Object containing form data
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const result = {};
    
    for (const [key, value] of formData.entries()) {
        result[key] = value;
    }
    
    return result;
}

// ===== URL/PARAMETER HELPERS =====

/**
 * Gets URL parameters as an object
 * @returns {Object} Object containing URL parameters
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    
    if (queryString) {
        const pairs = queryString.split('&');
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
    }
    
    return params;
}

/**
 * Builds a URL with query parameters
 * @param {string} baseUrl - The base URL
 * @param {Object} params - Object containing query parameters
 * @returns {string} The complete URL
 */
function buildUrl(baseUrl, params) {
    if (!params || Object.keys(params).length === 0) return baseUrl;
    
    const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// ===== ASYNC HELPERS =====

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Makes an API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Request options
 * @returns {Promise} Promise that resolves with the response data
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
} 