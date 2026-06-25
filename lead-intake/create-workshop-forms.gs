/**
 * Workshop Application Forms — Google Apps Script
 *
 * Creates all three workshop application forms and links responses to one spreadsheet.
 *
 * Setup:
 * 1. Go to https://script.google.com → New project
 * 2. Paste this entire file → Save (name: "Create Workshop Forms")
 * 3. Run createAllWorkshopForms → Authorize when prompted
 * 4. View → Logs (or Execution log) for form URLs and site-config.js snippet
 * 5. Copy the three forms.gle URLs into js/site-config.js
 *
 * Re-running creates duplicate forms — only run once unless you delete old forms first.
 */

var BRAND = 'Bespoke Core AI Engineering Limited';
var RESPONSE_SHEET_TITLE = 'Workshop Applications 2026';

var HEAR_ABOUT_OPTIONS = [
  'LinkedIn',
  'Google search',
  'Referral from a colleague',
  'Discovery call / main website',
  'Other'
];

var DELIVERY_OPTIONS = [
  'Virtual only',
  'Hybrid (virtual + optional in-person in Dublin)',
  'Either works for me'
];

/**
 * Run this function once.
 */
function createAllWorkshopForms() {
  var ss = SpreadsheetApp.create(RESPONSE_SHEET_TITLE);
  var results = [];

  results.push(createWorkshop1Form_(ss.getId()));
  results.push(createWorkshop2Form_(ss.getId()));
  results.push(createWorkshop3Form_(ss.getId()));

  var summary = [
    '=== Workshop forms created ===',
    '',
    'Response spreadsheet:',
    ss.getUrl(),
    'Spreadsheet ID: ' + ss.getId(),
    '',
    'Paste into js/site-config.js → workshopApplicationFormUrls:',
    '',
    'workshopApplicationFormUrls: {',
    "    foundations: '" + results[0].publishedUrl + "',",
    "    engineering: '" + results[1].publishedUrl + "',",
    "    automation:  '" + results[2].publishedUrl + "',",
    '},',
    '',
    '--- Form details ---',
    ''
  ];

  results.forEach(function (r) {
    summary.push(r.key + ': ' + r.title);
    summary.push('  Published: ' + r.publishedUrl);
    summary.push('  Edit:      ' + r.editUrl);
    summary.push('');
  });

  Logger.log(summary.join('\n'));
  return summary.join('\n');
}

function createWorkshop1Form_(spreadsheetId) {
  var form = FormApp.create(BRAND + ' — Workshop 1 Application: AI Foundations');
  configureForm_(form, spreadsheetId,
    'Apply for a seat in our half-day AI Foundations workshop (virtual or hybrid). ' +
    'You will hear within 5 business days with an invitation to pay, a waitlist place, or a request for more information.');

  form.addTextItem()
    .setTitle('Full name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Email address')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextIsEmail()
      .build());

  form.addTextItem()
    .setTitle('Company or organisation')
    .setHelpText('Leave blank if self-employed or applying as an individual.')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Job role / title')
    .setRequired(true);

  addMultipleChoice_(form, 'What best describes you?', [
    'Small business owner',
    'Admin / office staff',
    'Non-technical manager',
    'Other'
  ], true);

  addMultipleChoice_(form, 'How would you rate your current AI experience?', [
    'Complete beginner — never used AI tools',
    'Tried ChatGPT a few times',
    'Use ChatGPT regularly but have no system',
    'Some experience with other AI tools'
  ], true);

  form.addParagraphTextItem()
    .setTitle('What do you most want to get from this workshop?')
    .setHelpText('One or two sentences is fine.')
    .setRequired(true);

  addMultipleChoice_(form, 'Preferred delivery format', DELIVERY_OPTIONS, true);

  addDropdown_(form, 'How did you hear about us?', HEAR_ABOUT_OPTIONS, false);

  form.addParagraphTextItem()
    .setTitle('Anything else we should know?')
    .setRequired(false);

  addConsentItems_(form);

  return publishForm_(form, 'foundations', 'Workshop 1 — AI Foundations');
}

function createWorkshop2Form_(spreadsheetId) {
  var form = FormApp.create(BRAND + ' — Workshop 2 Application: AI Engineering');
  configureForm_(form, spreadsheetId,
    'Apply for our full-day AI Engineering workshop (virtual or hybrid). ' +
    'Hands-on session: Claude Code, PR validation, and test automation. ' +
    'Bring a laptop and a real repo or coding task. You will hear within 5 business days.');

  form.addTextItem()
    .setTitle('Full name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Business email')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextIsEmail()
      .build());

  form.addTextItem()
    .setTitle('Company')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Job title')
    .setRequired(true);

  addDropdown_(form, 'What best describes your role?', [
    'Software developer',
    'Tech lead / engineering manager',
    'CTO / VP Engineering',
    'Other technical role'
  ], true);

  form.addTextItem()
    .setTitle('Primary programming language(s)')
    .setHelpText('e.g. TypeScript, Python, Java, C#')
    .setRequired(true);

  addCheckbox_(form, 'Do you currently use any AI coding tools?', [
    'GitHub Copilot',
    'Cursor',
    'Claude Code',
    'ChatGPT for coding',
    'None yet',
    'Other'
  ], true);

  form.addParagraphTextItem()
    .setTitle('What specific challenge do you want to solve in this workshop?')
    .setHelpText('e.g. PR review backlog, missing test coverage, slow boilerplate work')
    .setRequired(true);

  addMultipleChoice_(form, 'Will you bring a laptop and a real repo or coding task?', [
    'Yes — I will come prepared',
    'I will prepare before the workshop',
    'I need advice on what to bring'
  ], true);

  addDropdown_(form, 'Rough team size you would roll this out to', [
    'Just me',
    '2–5 developers',
    '6–15 developers',
    '16+ developers'
  ], true);

  addMultipleChoice_(form, 'Preferred delivery format', DELIVERY_OPTIONS, true);

  addDropdown_(form, 'How did you hear about us?', HEAR_ABOUT_OPTIONS, false);

  form.addParagraphTextItem()
    .setTitle('Anything else we should know?')
    .setRequired(false);

  addConsentItems_(form);

  return publishForm_(form, 'engineering', 'Workshop 2 — AI Engineering');
}

function createWorkshop3Form_(spreadsheetId) {
  var form = FormApp.create(BRAND + ' — Workshop 3 Application: Agentic Workflow Automation');
  configureForm_(form, spreadsheetId,
    'Apply for our full-day Agentic Workflow Automation workshop (virtual or hybrid). ' +
    'For ops, finance, and compliance leaders. Map a real recurring task and leave with a two-week pilot plan. ' +
    'You will hear within 5 business days.');

  form.addTextItem()
    .setTitle('Full name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Business email')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextIsEmail()
      .build());

  form.addTextItem()
    .setTitle('Company')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Job title')
    .setRequired(true);

  addDropdown_(form, 'Industry', [
    'Pharma / life sciences',
    'Medical devices',
    'Manufacturing / engineering',
    'Finance / professional services',
    'Other regulated industry',
    'Other'
  ], true);

  addDropdown_(form, 'What best describes your role?', [
    'Operations / process owner',
    'Finance / accounts',
    'Quality / compliance',
    'Engineering / IT',
    'Management / innovation lead',
    'Other'
  ], true);

  form.addParagraphTextItem()
    .setTitle('Describe one recurring task you would like to automate')
    .setHelpText('e.g. invoice processing, PDF generation, email triage, supplier checks')
    .setRequired(true);

  addDropdown_(form, 'Roughly how many hours per week does this task take your team?', [
    'Less than 2 hours',
    '2–5 hours',
    '5–10 hours',
    '10+ hours',
    'Not sure'
  ], true);

  addMultipleChoice_(form, 'Do you currently use any AI tools for this work?', [
    'No — entirely manual',
    'ChatGPT ad hoc',
    'Some automation but not AI',
    'AI tools in production'
  ], true);

  addMultipleChoice_(form, 'Preferred delivery format', DELIVERY_OPTIONS, true);

  addDropdown_(form, 'How did you hear about us?', HEAR_ABOUT_OPTIONS, false);

  form.addParagraphTextItem()
    .setTitle('Anything else we should know?')
    .setRequired(false);

  addConsentItems_(form);

  return publishForm_(form, 'automation', 'Workshop 3 — Agentic Workflow Automation');
}

function configureForm_(form, spreadsheetId, description) {
  form.setDescription(description);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setPublishingSummary(true);
  form.setAcceptingResponses(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheetId);
  form.setConfirmationMessage(
    'Thank you — your application has been received. ' +
    'You will hear within 5 business days with next steps.'
  );
}

function addConsentItems_(form) {
  form.addCheckboxItem()
    .setTitle('Confirmations')
    .setChoiceValues([
      'I understand seats are limited and applying does not guarantee a place',
      'I agree to be contacted about this application (required for GDPR)'
    ])
    .setRequired(true);
}

function addMultipleChoice_(form, title, choices, required) {
  var item = form.addMultipleChoiceItem().setTitle(title);
  item.setChoices(choices.map(function (c) { return item.createChoice(c); }));
  item.setRequired(required);
  return item;
}

function addCheckbox_(form, title, choices, required) {
  form.addCheckboxItem()
    .setTitle(title)
    .setChoiceValues(choices)
    .setRequired(required);
}

function addDropdown_(form, title, choices, required) {
  var item = form.addListItem().setTitle(title);
  item.setChoices(choices.map(function (c) { return item.createChoice(c); }));
  item.setRequired(required);
  return item;
}

function publishForm_(form, key, title) {
  return {
    key: key,
    title: title,
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    formId: form.getId()
  };
}
