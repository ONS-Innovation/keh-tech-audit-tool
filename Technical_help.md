# Techincal Guidence to add new pages

### Introduction

The following documentation will provide guidence on adding a new page (new input to record), and what steps it involves.

### Creating the Page

The initial step will be to create the page that will capture the desired input withing the 'templates/' directory. As an example the 'miscellaneous.html' caputres data related to supporting tools so the page is within 'templates/section_supporting_tools/'. Nake sure the page is connected with the previous page and will direct the user top the sensible nex page/summary page of the correct section.

The pages should be created by following the design systems docuemntation. 

```https://service-manual.ons.gov.uk/design-system/components/summary```

### tech-audit-tool-api

Include a section to retrieve the new incoming data in the correct format/correct section in the 'api_models.py'


## Files Involved

The following files will require changes (most likely): 


### applycation.py


Include the page in the correct '..NavItems' array.
example:  
```bash
example: {"text": "The New page title", "url": "/survey/new html file"},
```

Include the new input in the 'map_form_data' array.
example:
```bash
example: {"key": "new html file", "default": expected return type},
```

Inlcude a new 'app.route(...)'.
example:
```bash
    @app.route("/survey/new html file", methods=[GET or POST])
    def new_input():
        return render_template("path to the new html file")
```


### formScripts.js


Add the new data to the 'changeBtnURL(..., newData)'.

Add the new data in the 'validations' array

example: 
```bash
        { 
            data: newData, 
            url: 'path to new html file', 
            validationFn: relevant validation method
        },
```


### submission.js


Add a new process function to process the incoming data (see submission.js for examples).

Add the return value of the new data to the 'normalizeApiData'.

Add the new data to the  'updateSummaryDisplay'.

Add the new data to the 'updateHiddenFields'.

Add the return value of the new data to the 'AppController'. 
example:
```bash
`new-data-data${suffix}`, 
```

Add the new data to the 'processedData'.


### summary.js 


Add a new data processor that extends the sectionrpocessor. 
example:
```bash
class NewDataProcessor extends SectionProcessor 
```

Add a new error manager to the 'SummaryManager'.

Include the new data in the 'loadData()' funciton.


### view_project.js 


Add a new section where the data is processed and shaped and provides teh default 'N/A' if there is no data given.

example:
```bash
    // New data
    document.getElementById('new_data_row').querySelector('dd').querySelector('span').textContent = 
        projects.new_data || 'N/A';
```

### utils.js 


Add the new data to the 'removeEdits()' function.
example:
```bash
'new_data-data-edit'
```


### project_summary.html

Include the new on the page. 

example: 

```bash
                                {
                                    "id": "new_data_details",
                                    "title": "New Data Title",
                                    "itemsList": [
                                        {
                                            "valueList": [
                                            {
                                                "text": ""
                                            }
                                        ],
                                            "actions": [
                                                {
                                                    "text": "Change",
                                                    "ariaLabel": "View answers for Mary Smith",
                                                    "url": url_for('new_data.html')
                                                }
                                            ]
                                        }
                                    ]
                                },
```

### survey.html

Add a new variable to the 'load_data()'.
example: 

```bash
var new_dataData = localStorage.getItem('new_data-data');
```

### validate_details.html

Add a section for the new data just like in 'project_summary.html'.


Add a new input source to the collection of inputs. 
example: 
```bash
<input id="new data html name" type="hidden" name="new data html name">
```

### view_project.html

Add a section for the new data according to the already present methods.