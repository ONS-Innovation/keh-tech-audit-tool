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
