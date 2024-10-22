function redirectToPrevious(){
    console.log(document.referrer);
    var url = new URL(document.referrer).pathname;
    if (url === '/validate_details' 
        || url === '/survey/project_summary' 
        || url === '/survey/tech_summary' 
        || url === '/survey/architecture_summary') {
        document.getElementById('save-values-button').href = new URL(document.referrer);
    }
}