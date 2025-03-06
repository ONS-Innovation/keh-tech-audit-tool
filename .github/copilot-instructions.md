# Tech Audit Tool
Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Project Context
A project used to survey out what tools, languages and frameworks are being used by various projects within DST.
- Uses the company design system

## Design System Context
- Written in Nunjucks
- Offers pre-styled and reusable components
- Located in `./templates/components`
- Example implementations of components are located in `./templates/components/<component>/example-<component>.njk`

## Rules
- Do not use a design system component unless it is an existing component located in the folder i.e. do not invent a new component name