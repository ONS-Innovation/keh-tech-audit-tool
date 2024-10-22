function redirectToPrevious(){
    console.log(document.referrer);
    var url = new URL(document.referrer).pathname;
    if (url === '/validate_details') {
        document.getElementById('save-values-button').href = new URL(document.referrer);
    }
}