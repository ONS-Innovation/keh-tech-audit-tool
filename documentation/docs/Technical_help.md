# Technical Guidance to add new pages

## Introduction

The following documentation will provide guidance on adding a new page (new input to record), and what steps it involves.

### Creating the Page

The initial step will be to create the page that will capture the desired input within the `templates/` directory. As an example the `miscellaneous.html` captures data related to supporting tools so the page is within `templates/section_supporting_tools/`. Make sure the page is connected with the previous page and will direct the user to the sensible next page/summary page of the correct section.

The pages should be created by following the design systems documentation.

[ONS Design System Manual](https://service-manual.ons.gov.uk/design-system/components/summary)

### tech-audit-tool-api

Include a section to retrieve the new incoming data in the correct format/correct section in the `api_models.py`

[`api_models.py`](https://github.com/ONS-Innovation/keh-tech-audit-tool-api/blob/main/aws_lambda_script/app/api_models.py)

```python
    "new_data": fields.String(
        required=False, new_data="Description of new data"
    ),
```

## Files Involved

The following files will require changes (most likely):

### application.py

Include the page in the correct `..NavItems` array.

example:

```python
    {"text": "The New page title", "url": "/survey/new html file"},
```

Include the new input in the `map_form_data` array.

example:

```python
    {"key": "new html file", "default": expected return type},
```

Include a new `app.route(...)`.

example:

```python
    @app.route("/survey/new html file", methods=[GET or POST])
    def new_input():
        return render_template("path to the new html file")
```

### formScripts.js

Add the new data to the `changeBtnURL(..., newData)`.

Add the new data in the `validations` array

example:

```js
    { 
        data: newData, 
        url: 'path to new html file', 
        validationFn: relevant validation method
    },
```

### submission.js

Add a new process function to process the incoming data (see submission.js for examples).

Add the return value of the new data to the `normalizeApiData()`.

Add the new data to the `updateSummaryDisplay()`.

Add the new data to the `updateHiddenFields()`.

Add the return value of the new data to the `AppController()`.

example:

```js
`new-data-data${suffix}`, 
```

Add the new data to the `processedData`.

### summary.js

Add a new data processor that extends the SectionProcessor.

example:

```js
class NewDataProcessor extends SectionProcessor 
```

Add a new error manager to the `SummaryManager()`function.

Include the new data in the `loadData()` function.

### view_project.js

Add a new section where the data is processed and shaped and provides the default `N/A` if there is no data given.

example:

```js
    // New data
    document.getElementById('new_data_row').querySelector('dd').querySelector('span').textContent = 
        projects.new_data || 'N/A';
```

### utils.js

Add the new data to the `removeEdits()` function.

example:

```js
'new_data-data-edit'
```

### project_summary.html

Include the new on the page.

example:

```js
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

Add a new variable to the `load_data()`.

example:

```js
var new_dataData = localStorage.getItem('new_data-data');
```

### validate_details.html

Add a section for the new data just like in `project_summary.html`.

Add a new input source to the collection of inputs.

example:

```js
<input id="new data html name" type="hidden" name="new data html name">
```

### view_project.html

Add a section for the new data according to the already present methods.

example:

```js
{
    "title": "Project",
    "id": "project_details_row",
    "itemsList": [
        {
            "id": "project-details",
            "valueList": [
                {
                    "text": ""
                }
            ]
        }
    ]
},
```
