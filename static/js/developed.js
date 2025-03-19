// Call redirectToPrevious to set up the return path when the page loads
document.addEventListener('DOMContentLoaded', function() {
    redirectToPrevious();
    loadData();
});

/**
 * Stores the "developed" data in localStorage
 * Captures the selected radio button value and any associated company name
 */
function storeData() {
    // Get the selected radio button
    const selectedRadio = document.querySelector('input[name="developed"]:checked');
    if (!selectedRadio) return;

    const developed = selectedRadio.value;
    let companyName = '';

    // Get company name based on selection
    if (developed === "Outsourced" || developed === "Partnership") {
        // Find the other-wrap element that's expanded (aria-expanded="true")
        const otherWraps = document.querySelectorAll('.ons-radio__other');
        for (const wrap of otherWraps) {
            if (wrap.parentNode.querySelector('input:checked')) {
                const input = wrap.querySelector('input[type="text"]');
                if (input) {
                    companyName = input.value;
                    break;
                }
            }
        }
    }

    console.log(`Saving developed: ${developed}, company: ${companyName}`);

    // Create data array
    const data = [developed];
    if (developed !== "In House") {
        data.push(companyName);
    }

    // Determine storage key based on edit mode
    const storageKey = JSON.parse(localStorage.getItem('edit')) ? 
        'developed-data-edit' : 'developed-data';

    // Store in localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));
}

/**
 * Loads the "developed" data from localStorage
 * Sets the appropriate radio button and populates company name if applicable
 */
function loadData() {
    const mapping = {
        "Outsourced": "outsourced",
        "Partnership": "partnership",
        "In House": "in-house"
    };

    // Get data from localStorage
    const storageKey = JSON.parse(localStorage.getItem('edit')) ? 
        'developed-data-edit' : 'developed-data';
    const data = JSON.parse(localStorage.getItem(storageKey));

    if (!data) return;

    try {
        // Handle both array and object formats
        if (Array.isArray(data)) {
            const radioId = mapping[data[0]];
            if (radioId) {
                document.getElementById(radioId).checked = true;
                
                // Set company name if applicable
                if (data[0] === "Outsourced" || data[0] === "Partnership") {
                    // Trigger the "other" field to show
                    const radioInput = document.getElementById(radioId);
                    if (radioInput) {
                        // Force the "other" field to expand
                        const otherWrap = document.getElementById(`${radioId}-other-wrap`);
                        if (otherWrap) {
                            otherWrap.style.display = 'block';
                            const input = otherWrap.querySelector('input[type="text"]');
                            if (input) {
                                input.value = data[1] || "";
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error loading developed data:', e);
    }
}
